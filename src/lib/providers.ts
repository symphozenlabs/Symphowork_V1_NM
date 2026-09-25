export type EmailMessage = { to: string; subject: string; html: string };
export interface EmailProvider { sendEmail(message: EmailMessage): Promise<void>; }
export interface StorageProvider {
  upload(key: string, body: Uint8Array, contentType: string): Promise<void>;
  download(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}
export interface AIProvider {
  generate(prompt: string): Promise<string>;
  embed(input: string): Promise<number[]>;
  parseStructured<T>(input: string, schema: unknown): Promise<T>;
}
export interface JobQueue { enqueue<TPayload>(name: string, payload: TPayload): Promise<void>; }
export interface BillingProvider { createCustomer(input: { organizationId: string; email?: string; name?: string }): Promise<{ customerId: string }>; createCheckoutSession(input: { organizationId: string; planCode: string; billingCycle: "monthly" | "annual" }): Promise<{ url: string }>; changeSubscription(input: { providerSubscriptionId: string; planCode: string; billingCycle: "monthly" | "annual" }): Promise<void>; cancelSubscription(input: { providerSubscriptionId: string }): Promise<void>; retrieveSubscription(input: { providerSubscriptionId: string }): Promise<unknown>; retrieveInvoices(input: { providerCustomerId: string }): Promise<unknown[]>; processWebhook(payload: unknown, signature?: string): Promise<void>; }
