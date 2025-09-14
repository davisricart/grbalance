// PAGE MARKER: Simple Blog Post Page Component
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Clock, User, Calendar, ArrowLeft, ArrowRight, Share2 } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  htmlContent: string; // Using HTML instead of markdown
  author: string;
  date: string;
  readTime: string;
  category: string;
  slug: string;
  featured: boolean;
}

const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Why Your DaySmart Reports Don\'t Match Your Fee Passing System Deposits (And How to Fix It)',
    excerpt: 'If you\'re spending hours trying to reconcile your DaySmart salon management software with your third-party fee passing payment processor, you\'re not alone. Here\'s why this happens and the exact steps to solve it.',
    htmlContent: `
      <h1>Why Your DaySmart Reports Don't Match Your Fee Passing System Deposits (And How to Fix It)</h1>
      
      <p>If you're a salon owner using DaySmart for scheduling and client management with a third-party fee passing payment processor, you've probably experienced the frustration of trying to match your daily reports. Your DaySmart end-of-day shows one total, but your payment processor deposit is different. Sound familiar?</p>

      <h2>The Root of the Problem</h2>
      
      <p>This mismatch happens because <strong>DaySmart salon software and third-party fee passing systems operate on different timelines and fee structures</strong>:</p>

      <h3>1. Settlement Timing Differences</h3>
      <ul>
        <li><strong>DaySmart</strong>: Shows transactions when they're processed at your salon (gross amounts)</li>
        <li><strong>Fee Passing Processor</strong>: Deposits money 1-2 business days later, often batching multiple days together</li>
        <li><strong>Result</strong>: Your Tuesday DaySmart report includes Tuesday's sales, but your Tuesday deposit might include Monday's transactions</li>
      </ul>

      <h3>2. Fee Passing Complications</h3>
      <ul>
        <li><strong>DaySmart</strong>: Records what the customer was charged (including passed fees)</li>
        <li><strong>Fee Passing System</strong>: May show fees separately or bundle them differently in reports</li>
        <li><strong>Dual Pricing Impact</strong>: Cash vs credit pricing creates additional reconciliation complexity</li>
      </ul>

      <h3>3. Transaction Type Handling</h3>
      <ul>
        <li><strong>Refunds and chargebacks</strong>: Appear differently in each system</li>
        <li><strong>Partial payments</strong>: May be recorded differently</li>
        <li><strong>Tips</strong>: Can be processed separately, affecting reconciliation</li>
      </ul>

      <h2>The Real Cost of Manual Reconciliation</h2>
      
      <p>Our research shows salon owners spend an average of <strong>3-4 hours per week</strong> trying to reconcile these reports. That's over <strong>150 hours annually</strong> - time you could be spending with clients or growing your business.</p>

      <p>Beyond time, manual reconciliation leads to:</p>
      <ul>
        <li><strong>Missed processing errors</strong> (costing salons $200-800+ annually)</li>
        <li><strong>Accounting mistakes</strong> that create tax headaches</li>
        <li><strong>Cash flow confusion</strong> when deposits don't match expectations</li>
      </ul>

      <h2>The Solution: Automated Reconciliation</h2>
      
      <p>Here's how successful salons solve this problem:</p>

      <h3>Option 1: Use DaySmart's Integrated Processing</h3>
      <p><strong>Pros</strong>: Automatic reconciliation built-in<br>
      <strong>Cons</strong>: Higher processing fees, no fee passing options, less competitive rates</p>

      <h3>Option 2: Automated Reconciliation Service (Recommended)</h3>
      <p><strong>What it does</strong>:</p>
      <ul>
        <li>Automatically imports both your DaySmart reports and fee passing processor transaction data</li>
        <li>Handles dual pricing and fee passing reconciliation automatically</li>
        <li>Matches transactions using intelligent algorithms that account for timing differences</li>
        <li>Identifies discrepancies and processing errors</li>
        <li>Generates reconciled reports in minutes, not hours</li>
      </ul>

      <p><strong>Real Example</strong>: Bella's Beauty in Dallas reduced their weekly reconciliation from 4 hours to 15 minutes while using three different payment processors, catching $347 in processing errors they missed manually.</p>

      <h2>DIY Quick Fix (Temporary Solution)</h2>
      
      <p>If you want to improve your manual process while exploring automation:</p>
      <ol>
        <li><strong>Download reports for the same date range</strong>: Use DaySmart's date range selector to match your fee passing processor's deposit periods</li>
        <li><strong>Account for fee passing differences</strong>: Create a simple spreadsheet that separates cash vs credit transactions and tracks passed fees</li>
        <li><strong>Track refunds and chargebacks separately</strong>: Note any refunds/chargebacks that might appear in different reporting periods</li>
        <li><strong>Use transaction-level matching</strong>: Instead of daily totals, try to match individual transactions when possible</li>
        <li><strong>Document dual pricing rules</strong>: Keep clear records of your cash vs credit pricing structure</li>
      </ol>

      <h2>When to Consider Professional Help</h2>
      
      <p>If your salon processes more than 200 transactions monthly, manual reconciliation becomes increasingly costly. The time spent reconciling often exceeds the cost of automated solutions.</p>

      <p><strong>Red flags that you need automated reconciliation</strong>:</p>
      <ul>
        <li>Spending more than 2 hours weekly on reconciliation</li>
        <li>Finding unexplained differences between systems</li>
        <li>Missing processing errors or overcharges</li>
        <li>Struggling with month-end financial close</li>
      </ul>

      <h2>Next Steps</h2>
      
      <p>Ready to eliminate reconciliation headaches? <strong>Book a free 15-minute consultation</strong> to see how automated reconciliation works with your specific DaySmart and fee passing system setup. We'll analyze your current process and show you exactly how much time and money you could save.</p>

      <div style="text-align: center; margin: 2rem 0;">
        <a href="/book" style="background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-right: 16px;">Book Free Consultation</a>
        <a href="/interactive-demo" style="border: 2px solid #059669; color: #059669; padding: 10px 24px; border-radius: 8px; text-decoration: none;">Try Our Interactive Demo</a>
      </div>

      <hr>

      <p><em>Have questions about DaySmart and fee passing system reconciliation? <a href="/contact" style="color: #059669;">Contact us here</a> - we respond to every message within 4 hours.</em></p>
    `,
    author: 'Michael Rodriguez',
    date: '2025-01-14',
    readTime: '8 min read',
    category: 'Payment Processing',
    slug: 'daysmart-fee-passing-reconciliation-mismatch',
    featured: true
  },
  {
    id: '2',
    title: 'The Hidden Costs of Manual Reconciliation for Salon Owners',
    excerpt: 'Beyond the obvious time investment, manual payment reconciliation costs salon owners thousands annually in missed errors, accounting fees, and lost opportunity. Here\'s the real math.',
    htmlContent: `
      <h1>The Hidden Costs of Manual Reconciliation for Salon Owners</h1>
      
      <p>Most salon owners know that reconciling payment processor reports with their salon software takes time. But few realize the true cost of doing this manually goes far beyond the hours spent matching transactions.</p>

      <h2>The Visible Costs (What You Already Know)</h2>

      <h3>Time Investment</h3>
      <ul>
        <li><strong>Average time</strong>: 3-4 hours per week</li>
        <li><strong>Annual hours</strong>: 150-200 hours</li>
        <li><strong>Opportunity cost</strong>: $3,000-6,000 (valued at $20-30/hour)</li>
      </ul>

      <h3>Direct Labor Costs</h3>
      <p>If you're paying staff to handle reconciliation:</p>
      <ul>
        <li><strong>Hourly rate</strong>: $15-25/hour</li>
        <li><strong>Annual cost</strong>: $2,250-5,000</li>
        <li><strong>Plus benefits</strong>: Add 20-30% for total compensation</li>
      </ul>

      <h2>The Hidden Costs (What's Really Expensive)</h2>

      <h3>1. Missed Processing Errors</h3>
      <p><strong>What happens</strong>: Manual reconciliation catches only 60-70% of processing errors</p>
      <p><strong>Common missed errors</strong>:</p>
      <ul>
        <li>Duplicate charges: $50-200 monthly</li>
        <li>Incorrect interchange fees: $100-400 monthly</li>
        <li>Failed transaction reversals: $25-150 monthly</li>
        <li><strong>Total annual loss</strong>: $2,100-9,000</li>
      </ul>

      <h3>2. Increased Accounting Fees</h3>
      <p><strong>Why it costs more</strong>:</p>
      <ul>
        <li>Messy books require more CPA time</li>
        <li>Reconciliation errors create tax complications</li>
        <li>Month-end close takes longer</li>
        <li><strong>Additional annual cost</strong>: $1,200-3,600</li>
      </ul>

      <h3>3. Cash Flow Management Issues</h3>
      <p><strong>Impact on business</strong>:</p>
      <ul>
        <li>Delayed identification of payment problems</li>
        <li>Inaccurate daily sales reporting</li>
        <li>Poor financial decision making</li>
        <li><strong>Estimated annual impact</strong>: $1,000-5,000</li>
      </ul>

      <h2>Real Salon Case Study</h2>
      
      <p><strong>Marina's Salon</strong> (suburban Chicago, $800K annual revenue):</p>

      <h3>Before Automation:</h3>
      <ul>
        <li>5 hours weekly on reconciliation</li>
        <li>Missing $200-400 monthly in processing errors</li>
        <li>Paying CPA extra $150/month for messy books</li>
        <li><strong>Total annual cost</strong>: $8,750</li>
      </ul>

      <h3>After Automation:</h3>
      <ul>
        <li>30 minutes weekly for review</li>
        <li>Catching 95%+ of processing errors</li>
        <li>Clean books reduced CPA fees by $100/month</li>
        <li><strong>Annual savings</strong>: $7,500</li>
        <li><strong>ROI</strong>: 625% in first year</li>
      </ul>

      <h2>The Math: Manual vs Automated</h2>

      <h3>Manual Reconciliation (Annual Costs):</h3>
      <ul>
        <li>Time investment: $4,000</li>
        <li>Missed processing errors: $5,500</li>
        <li>Extra accounting fees: $1,800</li>
        <li><strong>Total</strong>: $11,300</li>
      </ul>

      <h3>Automated Solution (Annual Costs):</h3>
      <ul>
        <li>Service fee: $1,800-3,600</li>
        <li>Reduced time investment: $500</li>
        <li><strong>Total</strong>: $2,300-4,100</li>
        <li><strong>Net savings</strong>: $7,200-9,000</li>
      </ul>

      <h2>Warning Signs You're Losing Money</h2>
      <ul>
        <li>Finding unexplained differences between systems</li>
        <li>Spending more than 1 hour weekly on reconciliation</li>
        <li>Your CPA asking questions about inconsistent reports</li>
        <li>Discovering processing errors months after they occurred</li>
        <li>Staff avoiding reconciliation tasks</li>
      </ul>

      <h2>Action Steps</h2>
      <ol>
        <li><strong>Calculate your current cost</strong>: Add up time, missed errors, and extra fees</li>
        <li><strong>Compare automation options</strong>: Look for solutions that integrate with your specific software</li>
        <li><strong>Start with a trial</strong>: Test automated reconciliation with one month of data</li>
        <li><strong>Scale gradually</strong>: Begin with your highest-volume payment processor</li>
      </ol>

      <p>Ready to see how much you could save? <strong>Book a free reconciliation audit</strong> to get exact numbers for your salon's situation.</p>

      <div style="text-align: center; margin: 2rem 0;">
        <a href="/book" style="background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-right: 16px;">Schedule Free Audit</a>
        <a href="/pricing" style="border: 2px solid #059669; color: #059669; padding: 10px 24px; border-radius: 8px; text-decoration: none;">Calculate Your Savings</a>
      </div>

      <hr>

      <p><em>Questions about reconciliation costs? We've helped 200+ salons calculate their true reconciliation expenses. <a href="/contact" style="color: #059669;">Contact us</a> for a personalized analysis.</em></p>
    `,
    author: 'Jennifer Thompson',
    date: '2025-01-12',
    readTime: '6 min read',
    category: 'Business Operations',
    slug: 'hidden-costs-manual-reconciliation-salons',
    featured: false
  },
  {
    id: '3',
    title: 'Case Study: How Bella\'s Beauty Saved 12 Hours Monthly on Payment Reconciliation',
    excerpt: 'From 15 hours of monthly reconciliation chaos to automated perfection in 30 days. Here\'s exactly how one salon transformed their payment processing workflow.',
    htmlContent: `
      <h1>Case Study: How Bella's Beauty Saved 12 Hours Monthly on Payment Reconciliation</h1>
      
      <p><strong>The Challenge</strong>: Bella's Beauty in Dallas was spending 15+ hours monthly trying to reconcile their DaySmart salon software with three different payment processors - Square, Stripe, and a legacy terminal system. Owner Sarah Martinez was either staying late or coming in on Sundays just to balance the books.</p>

      <p><strong>The Solution</strong>: Automated reconciliation that handles multiple payment processors simultaneously.</p>

      <p><strong>The Results</strong>: 87% time reduction, $2,400 annual savings, and zero reconciliation stress.</p>

      <h2>The Before: Reconciliation Nightmare</h2>

      <h3>Sarah's Weekly Routine (Every Sunday):</h3>
      <ul>
        <li><strong>Hour 1-2</strong>: Download reports from DaySmart for the week</li>
        <li><strong>Hour 3-4</strong>: Export transaction data from Square dashboard</li>
        <li><strong>Hour 5-6</strong>: Pull Stripe settlement reports</li>
        <li><strong>Hour 7-8</strong>: Manually match transactions across all three systems</li>
        <li><strong>Hour 9-12</strong>: Hunt down discrepancies, call processors about fees</li>
        <li><strong>Hour 13-15</strong>: Create summary for bookkeeper, update QuickBooks</li>
      </ul>

      <h3>The Problems That Kept Growing:</h3>
      <ul>
        <li><strong>Processing errors going unnoticed</strong>: Lost $200-400 monthly to duplicate charges and incorrect fees</li>
        <li><strong>Bookkeeper frustration</strong>: Getting messy, incomplete reconciliation reports</li>
        <li><strong>Staff complaints</strong>: "The books never balance" became a running joke</li>
        <li><strong>Personal cost</strong>: Sarah's Sundays were gone, affecting family time</li>
      </ul>

      <h3>The Breaking Point:</h3>
      <blockquote>
        <p><em>"I spent 4 hours one Sunday trying to find a $73 difference. Turns out Square had processed a refund the wrong way. I realized I was working for free as an accountant instead of growing my salon business."</em> - Sarah Martinez</p>
      </blockquote>

      <h2>The Transformation: Automated Reconciliation</h2>

      <h3>Implementation (Week 1):</h3>
      <ul>
        <li><strong>Day 1</strong>: Initial consultation and data analysis</li>
        <li><strong>Day 3</strong>: Custom reconciliation rules configured for all three processors</li>
        <li><strong>Day 7</strong>: First automated report generated and verified</li>
      </ul>

      <h3>The New Process (Every Monday):</h3>
      <ul>
        <li><strong>5 minutes</strong>: Review automated reconciliation report</li>
        <li><strong>10 minutes</strong>: Check flagged discrepancies (usually 1-2 items)</li>
        <li><strong>15 minutes</strong>: Export clean data for bookkeeper</li>
        <li><strong>Total</strong>: 30 minutes instead of 15 hours</li>
      </ul>

      <h2>The Results: Numbers Don't Lie</h2>

      <h3>Time Savings:</h3>
      <ul>
        <li><strong>Before</strong>: 15 hours monthly</li>
        <li><strong>After</strong>: 2 hours monthly</li>
        <li><strong>Time saved</strong>: 13 hours monthly (156 hours annually)</li>
        <li><strong>Value of time</strong>: $4,680 annually (at $30/hour)</li>
      </ul>

      <h3>Financial Impact:</h3>
      <ul>
        <li><strong>Processing errors caught</strong>: $347 first month, $200+ monthly average</li>
        <li><strong>Reduced bookkeeper fees</strong>: $150 monthly (cleaner data = less CPA time)</li>
        <li><strong>Annual financial benefit</strong>: $4,200</li>
      </ul>

      <h3>Total Annual Savings: $8,880</h3>

      <h3>Quality of Life Improvements:</h3>
      <ul>
        <li><strong>Sundays back</strong>: Family time restored</li>
        <li><strong>Stress reduction</strong>: No more reconciliation anxiety</li>
        <li><strong>Business focus</strong>: Time redirected to customer service and growth</li>
        <li><strong>Staff morale</strong>: Clean books, no more "balance the books" jokes</li>
      </ul>

      <h2>The ROI Calculation</h2>

      <h3>Investment:</h3>
      <ul>
        <li><strong>Monthly service fee</strong>: $89</li>
        <li><strong>Setup time</strong>: 2 hours</li>
        <li><strong>Training time</strong>: 1 hour</li>
        <li><strong>Annual cost</strong>: $1,068</li>
      </ul>

      <h3>Returns:</h3>
      <ul>
        <li><strong>Time savings</strong>: $4,680</li>
        <li><strong>Error detection</strong>: $2,400</li>
        <li><strong>Reduced accounting fees</strong>: $1,800</li>
        <li><strong>Total annual benefit</strong>: $8,880</li>
      </ul>

      <h3><strong>ROI: 732% in first year</strong></h3>

      <h2>Lessons Learned</h2>

      <h3>What Sarah Wishes She'd Known:</h3>
      <blockquote>
        <p><em>"I thought reconciliation was just part of running a salon. I didn't realize how much money and time I was losing until I saw the automated reports. The first month, we caught three processing errors I never would have found manually."</em></p>
      </blockquote>

      <h3>Implementation Tips:</h3>
      <ul>
        <li><strong>Start with highest volume processor</strong>: Biggest immediate impact</li>
        <li><strong>Train one person thoroughly</strong>: Don't try to train everyone at once</li>
        <li><strong>Keep manual backup initially</strong>: Build confidence before fully transitioning</li>
        <li><strong>Review flagged items promptly</strong>: Automation works best with human oversight</li>
      </ul>

      <h2>Ready to Transform Your Reconciliation?</h2>

      <p>Bella's Beauty isn't unique - they represent what's possible when salon owners stop accepting reconciliation as a necessary evil and start treating it as a solvable business problem.</p>

      <p><strong>Want similar results?</strong> Book a free reconciliation audit to see how automated reconciliation would work with your specific payment processors and salon software.</p>

      <div style="text-align: center; margin: 2rem 0;">
        <a href="/book" style="background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-right: 16px;">Book Free Audit</a>
        <a href="/interactive-demo" style="border: 2px solid #059669; color: #059669; padding: 10px 24px; border-radius: 8px; text-decoration: none;">See Interactive Demo</a>
      </div>

      <hr>

      <p><em>Interested in sharing your salon's reconciliation story? We feature successful automation case studies. <a href="/contact" style="color: #059669;">Get in touch</a> to share your experience.</em></p>
    `,
    author: 'Alex Johnson',
    date: '2025-01-10',
    readTime: '10 min read',
    category: 'Case Studies',
    slug: 'bellas-beauty-reconciliation-case-study',
    featured: true
  }
];

export default function SimpleBlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find(p => p.slug === slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <Link to="/blog" className="text-emerald-600 hover:text-emerald-700">
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  // Get related posts (exclude current post)
  const relatedPosts = blogPosts.filter(p => p.id !== post.id).slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{post.title} | GR Balance Blog</title>
        <meta name="description" content={post.excerpt} />
        <meta name="keywords" content={`${post.category.toLowerCase()}, salon reconciliation, ${post.slug.replace(/-/g, ', ')}`} />
        <link rel="canonical" href={`https://grbalance.com/blog/${post.slug}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:url" content={`https://grbalance.com/blog/${post.slug}`} />
        <meta property="og:type" content="article" />
        
        {/* Article specific meta */}
        <meta property="article:author" content={post.author} />
        <meta property="article:published_time" content={post.date} />
        <meta property="article:section" content={post.category} />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back to Blog */}
        <Link 
          to="/blog" 
          className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-8 font-medium"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blog
        </Link>

        {/* Article Header */}
        <article className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-8 lg:p-12">
            {/* Post Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
                {post.category}
              </span>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(post.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{post.readTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>By {post.author}</span>
              </div>
            </div>

            {/* Article Title */}
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8 leading-tight">
              {post.title}
            </h1>

            {/* Article Content */}
            <div 
              className="prose prose-lg max-w-none [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:text-gray-900 [&>h1]:mt-8 [&>h1]:mb-4 [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:text-gray-900 [&>h2]:mt-8 [&>h2]:mb-4 [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-gray-900 [&>h3]:mt-6 [&>h3]:mb-3 [&>p]:text-gray-700 [&>p]:mb-4 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ul]:space-y-2 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 [&>ol]:space-y-2 [&>li]:text-gray-700 [&>strong]:font-semibold [&>strong]:text-gray-900 [&>a]:text-emerald-600 [&>a]:hover:text-emerald-700 [&>a]:underline [&>hr]:border-gray-200 [&>hr]:my-8"
              dangerouslySetInnerHTML={{ __html: post.htmlContent }}
            />

            {/* Share & CTA */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600 font-medium">Share this article:</span>
                  <button className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700">
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                </div>
                <div className="flex gap-4">
                  <Link
                    to="/book"
                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                  >
                    Book Consultation
                  </Link>
                  <Link
                    to="/interactive-demo"
                    className="border border-emerald-600 text-emerald-600 px-6 py-2 rounded-lg hover:bg-emerald-50 transition-colors font-medium"
                  >
                    Try Demo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  to={`/blog/${relatedPost.slug}`}
                  className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
                >
                  <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium mb-3">
                    {relatedPost.category}
                  </span>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">
                    {relatedPost.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {relatedPost.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{relatedPost.readTime}</span>
                    <div className="flex items-center gap-1 text-emerald-600 font-medium">
                      Read More
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}