declare module "rtf-parser" {
    const parseRTF: any;
    export default parseRTF;
}

// Toss Payments SDK type declaration
declare global {
  interface Window {
    TossPayments: any;
  }
}

export {};