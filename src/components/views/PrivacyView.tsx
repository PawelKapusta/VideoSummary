import { LegalHeader } from '../shared/LegalHeader';
import { LegalFooter } from '../shared/LegalFooter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';

export function PrivacyView() {
  return (
    <>
      <LegalHeader activePage="privacy" />

      <div className="container mx-auto px-4 py-8 sm:py-12 pt-6 sm:pt-8 max-w-4xl">
        {/* Hero Section */}
        <div className="mb-8 sm:mb-12 text-center space-y-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Your privacy matters to us. Learn how we responsibly collect, use, and protect your personal information.
          </p>
          <p className="text-sm text-muted-foreground">Last Updated: December 13, 2025</p>
        </div>

        {/* Content */}
        <div className="space-y-6 sm:space-y-8 px-4 sm:px-0">
          {/* Quick Overview */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔒 Privacy First
              </CardTitle>
              <CardDescription>
                We respect your privacy and are committed to protecting your personal data. This policy explains our practices transparently.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Information We Collect */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">What Information We Collect</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-blue-700">👤 Account Data</CardTitle>
                  <CardDescription>Information you provide when creating an account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 flex-1">
                  <div className="flex items-center justify-between">
                    <span>Email address</span>
                    <Badge variant="secondary">Required</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Name</span>
                    <Badge variant="outline">Optional</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Password</span>
                    <Badge variant="secondary">Encrypted</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>User preferences</span>
                    <Badge variant="outline">Future</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">(coming soon)</p>
                </CardContent>
              </Card>

              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-purple-700">📊 Usage Data</CardTitle>
                  <CardDescription>How you interact with our service</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span>YouTube video URLs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Subscribed channels</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Generated summaries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Ratings and feedback</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-orange-700">💳 Payment Data</CardTitle>
                  <CardDescription>Future feature - not currently collected</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 flex-1">
                  <div className="flex items-center justify-between opacity-50">
                    <span>Payment info</span>
                    <Badge variant="outline">Future</Badge>
                  </div>
                  <div className="flex items-center justify-between opacity-50">
                    <span>Transaction history</span>
                    <Badge variant="outline">Future</Badge>
                  </div>
                  <div className="flex items-center justify-between opacity-50">
                    <span>Subscription status</span>
                    <Badge variant="outline">Future</Badge>
                  </div>
                  <div className="border-t border-orange-200 pt-3 mt-3">
                    <div className="flex items-center justify-center">
                      <span className="text-green-600 text-sm font-medium">✗ No full card storage</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator />

          {/* How We Use Data */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">How We Use Your Information</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-green-700">🚀 Service Delivery</CardTitle>
                  <CardDescription>To provide and maintain our core features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span>• Generate AI summaries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>• Manage accounts & subscriptions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>• Send service notifications</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-50">
                    <span>• Process payments (future)</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-blue-700">📈 Service Improvement</CardTitle>
                  <CardDescription>To enhance and optimize our platform</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span>• Analyze usage patterns</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>• Fix bugs & improve performance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>• Develop new features</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>• Improve service based on usage patterns</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator />

          {/* Data Sharing */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">Data Sharing & Security</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
              <Card className="h-full border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-700">✅ Trusted Partners</CardTitle>
                  <CardDescription>We only share data with essential service providers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 flex-1">
                  <div className="flex items-center justify-between">
                    <span>Supabase</span>
                    <Badge variant="secondary">Database</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>OpenRouter</span>
                    <Badge variant="secondary">AI Service</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>LLM Providers</span>
                    <Badge variant="secondary">AI Services</Badge>
                  </div>
                  <div className="text-center pt-2">
                    <Badge variant="outline" className="text-red-600 border-red-200">
                      🚫 We do NOT sell your data
                    </Badge>
          </div>
                </CardContent>
              </Card>

              <Card className="h-full border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-700">🔐 Security Measures</CardTitle>
                  <CardDescription>How we protect your information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>HTTPS/TLS encryption</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Encrypted data storage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Security best practices</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Access controls</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Secure password hashing</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator />

          {/* YouTube Data */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">YouTube Integration</h2>
            <Card>
              <CardHeader>
                <CardTitle>YouTube Data Handling</CardTitle>
                <CardDescription>
                  We only access publicly available YouTube data and respect platform policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">📥 What We Access</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Public video metadata</li>
                      <li>• Public captions/transcripts</li>
                      <li>• Channel information</li>
                      <li>• Video thumbnails</li>
            </ul>
          </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-800 mb-2">🚫 What We Don't Access</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• Your YouTube credentials</li>
                      <li>• Your watch history</li>
                      <li>• Private account data</li>
                      <li>• Video files themselves</li>
            </ul>
                  </div>
          </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">📋 YouTube API Compliance</h4>
                  <p className="text-sm text-blue-700 mb-2">
                    Our YouTube integration follows{' '}
                    <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener" className="underline">
                      YouTube Terms of Service
                    </a>
                    {' '}and{' '}
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" className="underline">
                      Google Privacy Policy
                    </a>.
                  </p>
                  <div className="text-xs text-blue-600 space-y-1">
                    <div>• We only access publicly available video metadata and captions</div>
                    <div>• We respect video privacy settings (private/unlisted videos)</div>
                    <div>• We provide attribution and links to original content</div>
                    <div>• We use content only for personal educational purposes</div>
                    <div>• For videos without captions, we may use AI to generate transcripts</div>
                    <div>• AI-generated transcripts are used only when official captions unavailable</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Your Rights */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">Your Privacy Rights</h2>
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-purple-700">🛡️ GDPR & CCPA Rights</CardTitle>
                <CardDescription>
                  You have control over your personal data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Badge variant="secondary" className="mt-0.5">Access</Badge>
                      <span className="text-sm">Request a copy of your personal data</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge variant="secondary" className="mt-0.5">Rectify</Badge>
                      <span className="text-sm">Correct inaccurate information</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge variant="secondary" className="mt-0.5">Erase</Badge>
                      <span className="text-sm">Delete your account and data</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-0.5">Portability</Badge>
                      <span className="text-sm">Data export functionality (coming soon)</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-0.5">Object</Badge>
                      <span className="text-sm">Object to personal data processing (including automated decisions)</span>
                    </div>
                  </div>
          </div>

                <div className="mt-6 p-4 bg-white border border-purple-200 rounded-lg">
                  <p className="text-sm font-semibold text-purple-800 mb-2">
                    📧 To exercise your rights, contact us at:
                  </p>
                  <p className="text-lg text-purple-700">
                    <a href="mailto:privacy@videosummary.com" className="hover:underline">
                      privacy@videosummary.com
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Contact */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle>📞 Contact Information</CardTitle>
                <CardDescription>
                  Questions about your privacy or data rights?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Privacy Inquiries</h4>
                    <a href="mailto:privacy@videosummary.com" className="text-blue-600 hover:underline">
                      privacy@videosummary.com
                    </a>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">General Support</h4>
                    <a href="mailto:support@videosummary.com" className="text-blue-600 hover:underline">
                      support@videosummary.com
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Acknowledgment */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">📝 Privacy Acknowledgment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-700 text-center">
                By using VideoSummary, you acknowledge that you have read and understood this Privacy Policy.
              </p>
            </CardContent>
          </Card>
        </div> 
      </div>
      <LegalFooter activePage="privacy" />
    </>
  );
}

