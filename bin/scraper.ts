#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ScraperStack } from '../lib/scraper-stack';
import { MainStack } from '../lib/main-stack';
import { EventsStack } from '../lib/events-stack';

const app = new cdk.App();
const mainStack = new MainStack(app, 'MainScraperStack', {
  stackName: 'scraper',
});

const { stateMachine } = new ScraperStack(mainStack, 'scraper-stack');
new EventsStack(mainStack, 'events-stack', {
  stateMachine,
});
