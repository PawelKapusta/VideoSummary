import { LegalHeader } from "../shared/LegalHeader";
import { LegalFooter } from "../shared/LegalFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";

interface TermsViewProps {
  isAuthenticated?: boolean;
}

export function TermsView({ isAuthenticated = false }: TermsViewProps) {
  return (
    <>
      <LegalHeader activePage="terms" isAuthenticated={isAuthenticated} />

      <div className="container mx-auto px-4 py-8 sm:py-12 pt-6 sm:pt-8 max-w-4xl">
        {/* Hero Section */}
        <div className="mb-8 sm:mb-12 text-center space-y-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Understanding our service agreement helps ensure a great experience for everyone using VideoSummary.
          </p>
          <p className="text-sm text-muted-foreground">Last Updated: December 13, 2025</p>
        </div>

        {/* Content */}
        <div className="space-y-6 sm:space-y-8 px-4 sm:px-0">
          {/* Quick Overview */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">📋 Quick Overview</CardTitle>
              <CardDescription>
                VideoSummary is an AI-powered service that creates summaries of YouTube videos using their public
                captions and transcripts.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Important Disclaimer - Moved to Top */}
          <Card className="border-yellow-200 bg-yellow-50 mx-4 sm:mx-0">
            <CardHeader>
              <CardTitle className="text-yellow-800">⚠️ Critical Service Disclaimer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-yellow-800 font-medium text-lg">
                  THE SERVICE IS PROVIDED "AS IS" WITHOUT ANY WARRANTIES OR GUARANTEES OF ANY KIND.
                </p>
                <div className="space-y-2">
                  <p className="text-yellow-700 font-medium">⚠️ VideoSummary bears NO RESPONSIBILITY for:</p>
                  <ul className="text-yellow-700 text-sm space-y-1 ml-4">
                    <li>• Accuracy, completeness, or correctness of AI-generated content</li>
                    <li>• Any errors, inaccuracies, or harmful information in summaries</li>
                    <li>• Use of content for legal, medical, financial, or other critical decisions</li>
                    <li>• Copyright violations or other intellectual property rights infringements</li>
                    <li>• Any damages resulting from the use of generated content</li>
                  </ul>
                  <p className="text-yellow-700 text-sm mt-3 font-medium">
                    AI may generate incorrect or misleading information. Always verify important information from
                    reliable sources.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Service Description */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">What We Offer</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-green-700">✅ What We Provide</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 text-base">
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold mt-1">•</span>
                      <div>
                        <span className="font-semibold">AI Summaries:</span> YouTube video summaries (currently in
                        Polish)
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold mt-1">•</span>
                      <div>
                        <span className="font-semibold">Transcripts:</span> Access to video transcripts (AI-generated
                        when official unavailable)
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold mt-1">•</span>
                      <div>
                        <span className="font-semibold">Organization:</span> Summary management tools
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold mt-1">•</span>
                      <div>
                        <span className="font-semibold">Subscriptions:</span> Auto-summaries for channels
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-red-700">❌ What We Don't Provide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  <div className="space-y-2">
                    <div className="font-semibold text-base">Original video content</div>
                    <div className="text-sm text-muted-foreground">
                      We only provide AI-generated summaries, not the actual video files or streaming capabilities
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="font-semibold text-base">Video downloads</div>
                    <div className="text-sm text-muted-foreground">
                      No downloading or offline access to video content - summaries are available online only
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="font-semibold text-base">Copyrighted materials</div>
                    <div className="text-sm text-muted-foreground">
                      We respect content creators' rights and do not distribute or host copyrighted video content
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator />

          {/* Service Limits */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">Service Limits & Requirements</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>⚙️ Current Limits</CardTitle>
                  <CardDescription>These limits help us maintain service quality</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Max channels per user:</span>
                    <Badge variant="outline">10</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Summaries per channel:</span>
                    <Badge variant="outline">1 per day</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Auto-generation time:</span>
                    <Badge variant="outline">7:00 PM daily</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Max video length:</span>
                    <Badge variant="outline">45 minutes</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>📋 Requirements</CardTitle>
                  <CardDescription>What you need for summaries</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Publicly available captions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>YouTube video URL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Active channel subscription</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600">✗</span>
                    <span>Private/unlisted videos</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator />

          {/* Rights & Responsibilities */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">Rights & Responsibilities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-blue-700">👤 Your Rights</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2 text-sm">
                    <li>• Full rights to your account data</li>
                    <li>• Delete your account anytime</li>
                    <li>• Personal use of summaries</li>
                    <li>• Account privacy & security</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-purple-700">🏢 Our Rights</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2 text-sm">
                    <li>• Ownership of AI-generated summaries</li>
                    <li>• Service operation & improvement</li>
                    <li>• Platform security measures</li>
                    <li>• Business continuity rights</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-orange-700">🎥 Creator Rights</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2 text-sm">
                    <li>• All rights to original videos</li>
                    <li>• Copyright protection</li>
                    <li>• Content removal requests</li>
                    <li>• Attribution requirements</li>
                    <li>• AI transcripts only when official unavailable</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator />

          {/* Acceptable Use */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">Acceptable Use Policy</h2>
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-700 flex items-center gap-2">🚫 Prohibited Activities</CardTitle>
                <CardDescription>You agree NOT to engage in these activities:</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ul className="space-y-2 text-sm">
                    <li>• Violate laws or regulations</li>
                    <li>• Use for commercial purposes</li>
                    <li>• Circumvent rate limits</li>
                    <li>• Scrape or automate access</li>
                  </ul>
                  <ul className="space-y-2 text-sm">
                    <li>• Replace watching original videos</li>
                    <li>• Remove attribution/links</li>
                    <li>• Resell or redistribute summaries</li>
                    <li>• Misuse the service</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Copyright & DMCA */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">Copyright & Content Policy</h2>
            <Card>
              <CardHeader>
                <CardTitle>🎨 Respect for Creators</CardTitle>
                <CardDescription>We respect intellectual property and support content creators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">✅ Our Commitment</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Personal/educational use only</li>
                    <li>• Drive traffic to original creators</li>
                    <li>• Transformative works based on public captions</li>
                    <li>• AI transcripts only when official unavailable</li>
                    <li>• Always provide attribution and links</li>
                  </ul>
                  <p className="text-sm text-green-700 mt-2">
                    <strong>Note:</strong> Content creators can request removal of their content via DMCA takedown
                    notices.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">📞 DMCA Compliance</h4>
                  <p className="text-sm text-blue-700 mb-2">
                    For copyright concerns, contact us at{" "}
                    <a href="mailto:support@videosummary.org" className="underline">
                      support@videosummary.org
                    </a>{" "}
                    with:
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1 ml-4">
                    <li>• Description of copyrighted work</li>
                    <li>• URL of summary in question</li>
                    <li>• Your contact information</li>
                    <li>• Statement of good faith belief</li>
                  </ul>
                  <p className="text-sm text-blue-700 mt-2">
                    <strong>Response time:</strong> Within 48 hours
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Contact */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle>📧 Contact Information</CardTitle>
                <CardDescription>Questions about these terms? Get in touch:</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg">
                  Email:{" "}
                  <a href="mailto:support@videosummary.org" className="text-blue-600 hover:underline">
                    support@videosummary.org
                  </a>
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Acknowledgment */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">📝 By using VideoSummary, you acknowledge that:</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-green-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">1.</span>
                  <span>You are using a service that generates summaries, not providing original content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">2.</span>
                  <span>All rights to original YouTube videos belong to their creators</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">3.</span>
                  <span>You will respect copyright and intellectual property rights</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">4.</span>
                  <span>You support content creators by visiting original videos</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
      <LegalFooter activePage="terms" />
    </>
  );
}
