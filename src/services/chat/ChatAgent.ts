export interface ChatAgent {
  processChat(userId: number, plantId: number, message: string): Promise<string>;
}
