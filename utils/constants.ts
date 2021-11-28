type Platforms = 'AMAZON.CA' | 'BESTBUY.CA' | 'WALMART.CA';
type Types =
  | 'amz-ps5-digital'
  | 'amz-ps5-disc'
  | 'bb-ps5-digital'
  | 'bb-ps5-disc'
  | 'wm-ps5-digital'
  | 'wm-ps5-disc';
type Products = 'PS5 - Digital' | 'PS5 - Disc'
export type PlatformProductType = {
  type: Types;
  platform: Platforms;
  product: Products;
  asin: string;
  url: string;
  checkedOn?: number;
};

export const PlatformProducts: PlatformProductType[] = [
  {
    type: 'amz-ps5-digital',
    platform: 'AMAZON.CA',
    product: 'PS5 - Digital',
    asin: 'B09DPLVH6G',
    url: 'https://www.amazon.ca/dp/B09DPLVH6G',
  },
  {
    type: 'bb-ps5-digital',
    platform: 'BESTBUY.CA',
    product: 'PS5 - Digital',
    asin: 'B09DPJ2TGW',
    url: 'https://www.bestbuy.ca/en-ca/product/playstation-5-digital-edition-console/15689335',
  },
  {
    type: 'wm-ps5-digital',
    platform: 'WALMART.CA',
    product: 'PS5 - Digital',
    asin: '6000202198823',
    url: 'https://www.walmart.ca/en/ip/playstation5-digital-edition/6000202198823',
  },
  {
    type: 'amz-ps5-disc',
    platform: 'AMAZON.CA',
    product: 'PS5 - Disc',
    asin: '',
    url: 'https://www.amazon.ca/dp/B09DPJ2TGW',
  },
  {
    type: 'bb-ps5-disc',
    platform: 'BESTBUY.CA',
    product: 'PS5 - Disc',
    asin: '15689336',
    url: 'https://www.bestbuy.ca/en-ca/product/playstation-5-console/15689336',
  },
  {
    type: 'wm-ps5-disc',
    platform: 'WALMART.CA',
    product: 'PS5 - Disc',
    asin: '6000202198562',
    url: 'https://www.walmart.ca/en/ip/playstation5-console/6000202198562',
  },
];