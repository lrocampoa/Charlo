import { verifySinpeReceipt } from '../visionAgent';

// Replace the GoogleGenerativeAI export with our mock
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockResolvedValue({
            response: {
              text: () => '```json\n{ "malformed": "json" \n```' // Invalid JSON string missing closing brace
            }
          })
        })
      };
    })
  };
});

describe('visionAgent', () => {
  beforeEach(() => {
    // Hide console.error during expected failure
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('verifySinpeReceipt', () => {
    it('should catch error and return fallback object when JSON parsing fails due to malformed response', async () => {
      const mimeType = 'image/jpeg';
      const base64Data = 'base64data';

      const result = await verifySinpeReceipt(mimeType, base64Data);

      expect(result).toEqual({
        isPaymentReceipt: false,
        confidence: 0,
        error: "Verification failed due to an error processing the image."
      });

      // Verify console.error was called
      expect(console.error).toHaveBeenCalledWith(
        "Failed to verify SINPE receipt:",
        expect.any(SyntaxError)
      );
    });
  });
});
