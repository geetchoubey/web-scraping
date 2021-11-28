import { Handler, Context } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { PlatformProductType } from '../../utils/constants';
import axios from 'axios';
import * as cheerio from 'cheerio';

const stepFunctions = new AWS.StepFunctions();

export const handler: Handler<PlatformProductType> = async (
  event,
  context: Context,
) => {
  console.log(
    `Scraping [${event.platform}] for [${event.product}]`,
  );
  const response = await axios.get(event.url);
  const $ = cheerio.load(response.data as string);
  const inStock = $('#add-to-cart-button').length > 0;
  const restockInformation = {
    ...event,
    timestamp: Date.now(),
    IN_STOCK: inStock,
    checkedOn: !inStock ? `${Date.now()}` : null,
  };
  return stepFunctions
    .startExecution({
      name: `${restockInformation.type}-${restockInformation.timestamp}`,
      input: JSON.stringify(restockInformation.type),
      stateMachineArn: `${process.env.SCRAPER_SF_ARN}`,
    })
    .promise();
};
