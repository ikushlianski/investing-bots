import { useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/demo/webhook-test')({
  component: WebhookTest,
})

type WebhookResponse = {
  success?: boolean
  error?: string
  message?: string
  receivedEvent?: string
  processedAt?: number
  details?: unknown
  status?: string
}

function WebhookTest() {
  const [webhookSecret, setWebhookSecret] = useState(
    'dev-secret-change-in-production'
  )
  const [eventType, setEventType] = useState('user.created')
  const [response, setResponse] = useState<WebhookResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const sendWebhook = async () => {
    setLoading(true)
    setResponse(null)

    try {
      const payload = {
        event: eventType,
        timestamp: Date.now(),
        data: {
          userId: '12345',
          email: 'test@example.com',
          metadata: {
            source: 'webhook-test-page',
          },
        },
      }

      const res = await fetch('/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': webhookSecret,
        },
        body: JSON.stringify(payload),
      })

      const data: Record<string, unknown> = await res.json()

      setResponse({ ...data, status: res.statusText })
    } catch (error) {
      const errorResponse: WebhookResponse = {
        error: 'Network error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }

      setResponse(errorResponse)
    } finally {
      setLoading(false)
    }
  }

  const checkEndpoint = async () => {
    setLoading(true)
    setResponse(null)

    try {
      const res = await fetch('/api/webhook')
      const data: Record<string, unknown> = await res.json()

      setResponse({ ...data, status: res.statusText })
    } catch (error) {
      const errorResponse: WebhookResponse = {
        error: 'Network error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }

      setResponse(errorResponse)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen p-4 text-white"
      style={{
        backgroundColor: '#000',
        backgroundImage:
          'radial-gradient(ellipse 60% 60% at 0% 100%, #444 0%, #222 60%, #000 100%)',
      }}
    >
      <div className="w-full max-w-3xl p-8 rounded-xl backdrop-blur-md bg-black/50 shadow-xl border-8 border-black/10">
        <h1 className="text-3xl font-bold mb-6">Webhook API Test</h1>

        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Endpoint Status</h2>
            <button
              onClick={() => {
                void checkEndpoint()
              }}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Check Endpoint
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Send Webhook</h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="webhook-secret"
                  className="block text-sm font-medium mb-2"
                >
                  Webhook Secret
                </label>
                <input
                  id="webhook-secret"
                  type="text"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter webhook secret"
                />
              </div>

              <div>
                <label
                  htmlFor="event-type"
                  className="block text-sm font-medium mb-2"
                >
                  Event Type
                </label>
                <input
                  id="event-type"
                  type="text"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., user.created"
                />
              </div>

              <button
                onClick={() => {
                  void sendWebhook()
                }}
                disabled={loading}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Sending...' : 'Send Webhook'}
              </button>
            </div>
          </div>

          {response && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Response</h2>
              <div
                className={`p-4 rounded-lg ${
                  response.success || response.status === 'ok'
                    ? 'bg-green-900/30 border border-green-500/30'
                    : 'bg-red-900/30 border border-red-500/30'
                }`}
              >
                <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Usage Instructions</h2>
            <div className="space-y-3 text-sm text-white/80">
              <p>
                <strong>Endpoint:</strong> POST /api/webhook
              </p>
              <p>
                <strong>Required Header:</strong> x-webhook-secret
              </p>
              <p>
                <strong>Payload Structure:</strong>
              </p>
              <pre className="bg-black/30 p-3 rounded mt-2 text-xs overflow-x-auto">
                {JSON.stringify(
                  {
                    event: 'string (required)',
                    timestamp: 'number (required)',
                    data: 'object (required)',
                  },
                  null,
                  2
                )}
              </pre>
              <p className="mt-3">
                <strong>Environment Variable:</strong> Set WEBHOOK_SECRET in
                wrangler.jsonc or use Cloudflare secrets for production
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
