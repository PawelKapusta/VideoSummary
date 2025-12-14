import { LegalHeader } from '../shared/LegalHeader';
import { LegalFooter } from '../shared/LegalFooter';

export function TermsView() {
  return (
    <>
      <LegalHeader activePage="terms" />

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-3">Terms of Service</h1>
          <p className="text-muted-foreground text-base">Please read these terms carefully before using our service</p>
          <p className="text-sm text-muted-foreground mt-2">Last Updated: December 13, 2025</p>
        </div>

        {/* Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-4 prose-h2:pt-8 prose-h2:border-t prose-h2:border-border prose-h2:first:mt-0 prose-h2:first:pt-0 prose-h2:first:border-t-0 prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3 prose-h3:ml-4 prose-p:text-base prose-p:leading-7 prose-li:text-base prose-strong:text-foreground prose-ul:ml-8 prose-ol:ml-8">

          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using VideoSummary ("the Service"), you accept and agree to be bound by the terms and provisions of this agreement.</p>

          <h2>2. Description of Service</h2>
          <p>VideoSummary provides AI-powered summarization services for YouTube videos. We generate summaries based on publicly available captions and transcripts from YouTube videos.</p>

          <div className="ml-4">
            <p><strong>What We Provide:</strong></p>
            <ul>
              <li>AI-generated summaries of YouTube videos (provided in Polish)</li>
              <li>Access to video transcripts (when publicly available)</li>
              <li>Organization and management of your summaries</li>
              <li>Subscription to YouTube channels for automatic summaries</li>
            </ul>

            <p><strong>What We Don't Provide:</strong></p>
            <ul>
              <li>Original video content (all rights belong to content creators)</li>
              <li>Downloaded video files</li>
              <li>Copyrighted material</li>
            </ul>
          </div>

          <h2>3. User Accounts and Service Limits</h2>

          <div className="ml-4">
            <p><strong>Current Service Limits:</strong></p>
            <ul>
              <li>Maximum <strong>10 subscribed channels</strong> per user</li>
              <li>One summary generation per channel per day (shared globally)</li>
              <li>Automatic daily summaries at 7:00 PM</li>
              <li>Manual summary generation available for subscribed channels</li>
            </ul>

            <p><strong>Video Limitations:</strong></p>
            <ul>
              <li>Video length: <strong>Maximum 45 minutes</strong></li>
              <li>Videos <strong>must</strong> have publicly available captions/transcripts</li>
              <li>Rate limits apply to prevent abuse</li>
            </ul>

            <p><strong>Future Plans:</strong> <em>(After MVP)</em></p>
            <ul>
              <li><em>Paid subscription tiers with increased limits</em></li>
              <li><em>Priority processing for premium users</em></li>
              <li><em>Advanced features and customization options</em></li>
            </ul>
          </div>

          <h2>4. Intellectual Property</h2>

          <div className="ml-4">
            <p><strong>Your Rights:</strong></p>
            <ul>
              <li>You retain <strong>all rights</strong> to your account data and preferences</li>
              <li>You may export your summaries at any time</li>
            </ul>

            <p><strong>Our Rights:</strong></p>
            <ul>
              <li>VideoSummary owns the AI-generated summaries</li>
              <li>You have a license to use summaries for <strong>personal use only</strong></li>
              <li>Commercial use of summaries is <strong>NOT</strong> permitted without written permission</li>
            </ul>

            <p><strong>Third-Party Rights:</strong></p>
            <ul>
              <li><strong>All rights to original YouTube videos belong to their creators</strong></li>
              <li>We do <strong>NOT</strong> claim ownership of any YouTube content</li>
              <li>Summaries are transformative works based on public captions</li>
              <li>We <strong>always</strong> provide attribution and links to original videos</li>
            </ul>
          </div>

          <h2>5. Acceptable Use</h2>
          <p>You agree <strong>NOT</strong> to:</p>
          <ul className="ml-4">
            <li>Use the Service to violate any laws or regulations</li>
            <li>Use summaries for <strong>commercial purposes</strong> without written permission</li>
            <li>Attempt to circumvent rate limits or usage restrictions</li>
            <li>Scrape or automate access to the Service without permission</li>
            <li>Use summaries to replace watching original videos (support creators!)</li>
            <li>Remove attribution or links to original content</li>
            <li>Resell or redistribute summaries without permission</li>
          </ul>

          <h2>6. Content and Copyright</h2>

          <div className="ml-4">
            <p><strong>Respect for Creators:</strong></p>
            <ul>
              <li>We respect the intellectual property rights of YouTube content creators</li>
              <li>Summaries are generated for <strong>personal educational and productivity purposes only</strong></li>
              <li>Summaries are <strong>NOT</strong> intended for commercial use or redistribution</li>
              <li>We provide links to original videos to drive traffic to creators</li>
              <li>Content creators can request removal of their content from our service</li>
            </ul>

            <p><strong>DMCA Compliance:</strong></p>
            <p>If you believe your copyrighted work has been used inappropriately, please contact us at <a href="mailto:support@ytinsights.com">support@ytinsights.com</a> with the following information:</p>
            <ul>
              <li>Description of the copyrighted work</li>
              <li>URL of the summary in question</li>
              <li>Your contact information</li>
              <li>A statement of good faith belief</li>
            </ul>
            <p>We will respond to valid DMCA notices within <strong>48 hours</strong>.</p>
          </div>

          <h2>7. Disclaimer of Warranties</h2>
          <p><strong>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.</strong></p>

          <h2>8. Contact</h2>
          <p>For questions about these Terms, contact us at: <a href="mailto:support@ytinsights.com">support@ytinsights.com</a></p>

          <div className="mt-12 pt-8 border-t border-border">
            <div className="bg-muted/50 border border-border rounded-lg p-6">
              <p className="text-sm font-semibold mb-3">
                By using VideoSummary, you acknowledge that:
              </p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>You are using a service that generates summaries, not providing original content</li>
                <li>All rights to original YouTube videos belong to their creators</li>
                <li>You will respect copyright and intellectual property rights</li>
                <li>You support content creators by visiting original videos</li>
              </ol>
            </div>
          </div>
        </div>

        <LegalFooter />
      </div>
    </>
  );
}

