import { Context, EventBridgeEvent } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { PlatformProductType } from '../../utils/constants';

const stepFunctions = new AWS.StepFunctions();

export const handler = async (
  event: EventBridgeEvent<'PlatformProducts', PlatformProductType[]>,
  context: Context,
) => {
  return Promise.all(
    event.detail.map(product => {
      return stepFunctions
        .startExecution({
          name: `${product.type}-${Date.now()}`,
          input: JSON.stringify(product),
          stateMachineArn: `${process.env.SCRAPER_SF_ARN}`,
        })
        .promise();
    }),
  );
};
