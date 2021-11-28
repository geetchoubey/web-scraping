import * as cdk from '@aws-cdk/core';
import { AttributeType, Table } from '@aws-cdk/aws-dynamodb';
import { Rule, Schedule } from '@aws-cdk/aws-events';
import {
  Choice,
  Condition,
  Parallel,
  StateMachine,
  TaskInput,
} from '@aws-cdk/aws-stepfunctions';
import { Topic } from '@aws-cdk/aws-sns';
import * as lambda from '@aws-cdk/aws-lambda';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import * as path from 'path';
import { LambdaInvoke, SnsPublish } from '@aws-cdk/aws-stepfunctions-tasks';
import { DynamoPutItem } from '@aws-cdk/aws-stepfunctions-tasks/lib/dynamodb/put-item';
import { DynamoAttributeValue } from '@aws-cdk/aws-stepfunctions-tasks/lib/dynamodb/shared-types';

export class ScraperStack extends cdk.NestedStack {
  public stateMachine: StateMachine;

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    this.stateMachine = this.getStateMachine();
  }

  getDynamoDbTable() {
    const table = new Table(this, 'scraper-results', {
      tableName: `${this.stackName}-results-table`,
      partitionKey: {
        name: 'type',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: AttributeType.NUMBER,
      },
      readCapacity: 1,
      writeCapacity: 1,
      timeToLiveAttribute: 'checkedOn',
    });
    table.autoScaleReadCapacity({
      minCapacity: 1,
      maxCapacity: 25,
    });
    table.autoScaleWriteCapacity({
      minCapacity: 1,
      maxCapacity: 25,
    });
    return table;
  }

  getWebScraperLambda() {
    return new NodejsFunction(this, 'web-scraper', {
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      runtime: lambda.Runtime.NODEJS_14_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'handler',
      bundling: {
        minify: true,
      },
      functionName: `${this.stackName}-scraper`,
      entry: path.join(__dirname, '..', 'src', 'scraper', 'index.ts'),
    });
  }

  getStateMachine() {
    const lambdaFunction = this.getWebScraperLambda();
    const scrapingTask = new LambdaInvoke(this, 'start-web-scraping', {
      lambdaFunction,
    }).addRetry({
      interval: cdk.Duration.seconds(3),
      maxAttempts: 10,
    });

    const table = this.getDynamoDbTable();
    const topic = new Topic(this, 'subscribers-topic', {
      topicName: 'restock-topic',
    });

    const publishToTopic = new SnsPublish(this, 'publish-to-topic', {
      topic,
      message: TaskInput.fromJsonPathAt('$'),
    });

    const checkInStock = new Choice(this, 'is in stock').when(
      Condition.booleanEquals('$.IN_STOCK', true),
      publishToTopic,
    );
    const writeToDb = new DynamoPutItem(this, 'write-to-db', {
      table,
      item: {
        type: DynamoAttributeValue.fromString('type'),
        platform: DynamoAttributeValue.fromString('platform'),
        product: DynamoAttributeValue.fromString('product'),
        asin: DynamoAttributeValue.fromString('asin'),
        url: DynamoAttributeValue.fromString('url'),
        checkedOn: DynamoAttributeValue.fromNumber(
          TaskInput.fromJsonPathAt('$.checkedOn').value as number,
        ),
        timestamp: DynamoAttributeValue.fromNumber(
          TaskInput.fromJsonPathAt('$.timestamp').value as number,
        ),
        IN_STOCK: DynamoAttributeValue.fromBoolean(
          TaskInput.fromJsonPathAt('$.IN_STOCK').value as boolean,
        ),
      },
      resultPath: '$.Item',
    });
    const parallelTasks = new Parallel(this, 'parallel-step').branch(
      writeToDb,
      checkInStock,
    );
    const chain = scrapingTask.next(parallelTasks);
    const stateMachine = new StateMachine(this, 'scraper-processor', {
      stateMachineName: 'scaper-processor',
      definition: chain,
    });
    topic.grantPublish(stateMachine);
    lambdaFunction.grantInvoke(stateMachine);
    table.grantReadWriteData(stateMachine);

    return stateMachine;
  }
}
