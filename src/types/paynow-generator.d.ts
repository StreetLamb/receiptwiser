declare module 'paynow-generator' {
  /**
   * Generates a PayNow QR code string for Singapore payment system
   *
   * @param proxyType - 'mobile' or 'UEN'
   * @param proxyValue - 8 digit Singapore phone number or company UEN
   * @param editable - 'yes' or 'no' - Defined whether the price value can be edited by the user
   * @param amount - number input - sets the value of the payment request
   * @param merchantName - Defines the merchant name (returns NA if blank)
   * @param additionalComments - Additional data field typically used to generate strings used for reconciliation purposes
   * @returns PayNow QR code string
   */
  export function paynowGenerator(
    proxyType: 'mobile' | 'uen',
    proxyValue: string,
    editable: 'yes' | 'no',
    amount: number,
    merchantName?: string,
    additionalComments?: string
  ): string;
}
