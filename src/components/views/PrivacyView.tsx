import { LegalHeader } from '../shared/LegalHeader';
import { LegalFooter } from '../shared/LegalFooter';

export function PrivacyView() {
  return (
    <>
      <LegalHeader activePage="privacy" />

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-3">Privacy Policy</h1>
          <p className="text-muted-foreground text-base">How we collect, use, and protect your data</p>
          <p className="text-sm text-muted-foreground mt-2">Last Updated: December 13, 2025</p>
        </div>

        {/* Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-4 prose-h2:pt-8 prose-h2:border-t prose-h2:border-border prose-h2:first:mt-0 prose-h2:first:pt-0 prose-h2:first:border-t-0 prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3 prose-h3:ml-4 prose-p:text-base prose-p:leading-7 prose-li:text-base prose-strong:text-foreground prose-ul:ml-8 prose-ol:ml-8">

          <h2>1. Introduction</h2>
          <p>VideoSummary ("we", "our", "us") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and protect your information.</p>

          <h2>2. Information We Collect</h2>

          <div className="ml-4">
            <p><strong>2.1 Account Information:</strong></p>
            <ul>
              <li>Email address</li>
              <li>Name (optional)</li>
              <li>Password (encrypted)</li>
              <li>Account preferences</li>
            </ul>

            <p><strong>2.2 Usage Data:</strong></p>
            <ul>
              <li>YouTube video URLs you submit for summarization</li>
              <li>Channels you subscribe to within our service</li>
              <li>Summaries you generate</li>
              <li>Ratings and feedback you provide</li>
            </ul>

            <p><strong>2.3 Payment Information:</strong> <em>(After MVP - not currently collected)</em></p>
            <ul>
              <li><em>Payment information will be processed by our payment provider</em></li>
              <li><em>We will NOT store full credit card numbers</em></li>
              <li><em>We will store transaction history and subscription status</em></li>
            </ul>
          </div>

          <h2>3. How We Use Your Information</h2>

          <div className="ml-4">
            <p><strong>3.1 Provide the Service:</strong></p>
            <ul>
              <li>Generate AI summaries of YouTube videos</li>
              <li>Manage your account and channel subscriptions</li>
              <li>Send service-related notifications</li>
              <li><em>Process payments (after MVP)</em></li>
            </ul>

            <p><strong>3.2 Improve the Service:</strong></p>
            <ul>
              <li>Analyze usage patterns</li>
              <li>Fix bugs and improve performance</li>
              <li>Develop new features</li>
              <li>Train and improve our AI models</li>
            </ul>
          </div>

          <h2>4. Data Sharing and Disclosure</h2>
          <p><strong>We do NOT sell your personal data.</strong></p>
          <p>We may share data with the following service providers:</p>

          <div className="ml-4">
            <p><strong>4.1 Service Providers:</strong></p>
            <ul>
              <li><strong>Supabase</strong>: Database and authentication</li>
              <li><strong>OpenRouter</strong>: AI model aggregation service</li>
              <li><strong>Google (Gemini)</strong>: LLM provider for generating summaries (video transcripts are processed via OpenRouter)</li>
              <li><em><strong>Payment Processors</strong>: For payment processing (after MVP)</em></li>
            </ul>
          </div>

          <h2>5. YouTube Data</h2>

          <div className="ml-4">
            <p><strong>5.1 What We Access:</strong></p>
            <ul>
              <li>Publicly available video metadata (title, description, thumbnail)</li>
              <li>Publicly available captions/transcripts</li>
              <li>Channel information for subscribed channels</li>
            </ul>

            <p><strong>5.2 What We Don't Access:</strong></p>
            <ul>
              <li>Your YouTube account credentials</li>
              <li>Your YouTube watch history</li>
              <li>Your private YouTube data</li>
              <li>Video files themselves</li>
            </ul>

            <p><strong>5.3 YouTube API Services:</strong></p>
            <p>Our use of YouTube API Services is subject to <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener">YouTube Terms of Service</a> and <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google Privacy Policy</a>.</p>
          </div>

          <h2>6. Your Rights (GDPR/CCPA)</h2>
          <p>You have the following rights:</p>
          <ul className="ml-4">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Rectification:</strong> Correct inaccurate personal data</li>
            <li><strong>Erasure:</strong> Delete your account and associated data</li>
            <li><strong>Portability:</strong> Export your data in machine-readable format</li>
            <li><strong>Objection:</strong> Opt-out of marketing emails</li>
          </ul>

          <p><strong>To exercise your rights, contact us at <a href="mailto:privacy@ytinsights.com">privacy@ytinsights.com</a></strong></p>

          <h2>7. Data Security</h2>
          <p>We implement the following security measures:</p>
          <ul className="ml-4">
            <li>Encryption in transit (HTTPS/TLS)</li>
            <li>Encryption at rest for sensitive data</li>
            <li>Regular security audits</li>
            <li>Access controls and authentication</li>
            <li>Secure password hashing</li>
          </ul>

          <h2>8. Contact Us</h2>
          <p>For privacy-related questions or to exercise your rights, contact us at:</p>
          <ul className="ml-4">
            <li><strong>Email:</strong> <a href="mailto:privacy@ytinsights.com">privacy@ytinsights.com</a></li>
            <li><strong>Support:</strong> <a href="mailto:support@ytinsights.com">support@ytinsights.com</a></li>
          </ul>

          <div className="mt-12 pt-8 border-t border-border">
            <div className="bg-muted/50 border border-border rounded-lg p-6 text-center">
              <p className="text-sm text-muted-foreground">
                By using VideoSummary, you acknowledge that you have read and understood this Privacy Policy.
              </p>
            </div>
          </div>
        </div>

        <LegalFooter />
      </div>
    </>
  );
}

