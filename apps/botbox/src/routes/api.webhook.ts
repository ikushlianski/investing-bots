import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { z } from 'zod'

const webhookPayloadSchema = z.object({
  event: z.string(),
  timestamp: z.number(),
  data: z.record(z.unknown()),
})

type WebhookPayload = z.infer<typeof webhookPayloadSchema>

const validateWebhookSecret = (
  secret: string | null,
  expectedSecret: string
): boolean => {
  if (!secret) {
    return false
  }

  return secret === expectedSecret
}

export const Route = createFileRoute('/api/webhook')({
  server: {
    handlers: {
      GET: () => {
        return json(
          {
            status: 'ok',
            message:
              'Webhook endpoint is active. Use POST to send webhook events.',
          },
          { status: 200 }
        )
      },
      POST: async ({ request }) => {
        try {
          const envSecret = import.meta.env.WEBHOOK_SECRET as unknown
          const webhookSecret =
            typeof envSecret === 'string'
              ? envSecret
              : 'dev-secret-change-in-production'
          const providedSecret = request.headers.get('x-webhook-secret')

          if (!validateWebhookSecret(providedSecret, webhookSecret)) {
            return json(
              {
                error: 'Unauthorized',
                message: 'Invalid or missing webhook secret',
              },
              { status: 401 }
            )
          }

          const body = await request.json()
          const validationResult = webhookPayloadSchema.safeParse(body)

          if (!validationResult.success) {
            return json(
              {
                error: 'Invalid payload',
                message: 'Webhook payload validation failed',
                details: validationResult.error.format(),
              },
              { status: 400 }
            )
          }

          const payload: WebhookPayload = validationResult.data

          return json(
            {
              success: true,
              message: 'Webhook processed successfully',
              receivedEvent: payload.event,
              processedAt: Date.now(),
            },
            { status: 200 }
          )
        } catch (error) {
          console.error('Webhook processing error:', error)

          return json(
            {
              error: 'Internal server error',
              message: 'Failed to process webhook',
            },
            { status: 500 }
          )
        }
      },
    },
  },
})
