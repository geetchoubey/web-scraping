import { Construct, NestedStack } from '@aws-cdk/core';
import { Rule, RuleTargetInput, Schedule } from '@aws-cdk/aws-events';
import * as cdk from '@aws-cdk/core';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import * as lambda from '@aws-cdk/aws-lambda';
import * as path from 'path';
import { LambdaFunction } from '@aws-cdk/aws-events-targets';
import { PlatformProducts } from '../utils/constants';
import { StateMachine } from '@aws-cdk/aws-stepfunctions'

export type Props = {
  stateMachine: StateMachine;
};

export class EventsStack extends NestedStack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const cronRule = new Rule(this, `cron-rule`, {
      enabled: true,
      description: `Invoke a lambda every minute to fetch product details`,
      ruleName: `${this.stackName}-start-rule`,
      schedule: Schedule.rate(cdk.Duration.minutes(1)),
    });

    const lambdaFunction = new NodejsFunction(this, 'scraper-initialize', {
      memorySize: 128,
      timeout: cdk.Duration.seconds(30),
      runtime: lambda.Runtime.NODEJS_14_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'handler',
      bundling: {
        minify: true,
        externalModules: ['aws-sdk'],
      },
      environment: {
        SCRAPER_SF_ARN: props.stateMachine.stateMachineArn
      },
      functionName: `${this.stackName}-initialize`,
      entry: path.join(__dirname, '..', 'src', 'eventsProcessor', 'index.ts'),
    });

    props.stateMachine.grantStartExecution(lambdaFunction);

    const lambdaInvokeTarget = new LambdaFunction(lambdaFunction, {
      event: RuleTargetInput.fromObject(PlatformProducts),
    });

    cronRule.addTarget(lambdaInvokeTarget);
  }
}
