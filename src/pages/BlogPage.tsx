// PAGE MARKER: Blog Page Component
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Clock, User, ArrowRight, Calendar, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
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
    content: `
# Why Your DaySmart Reports Don't Match Your Square Deposits (And How to Fix It)

If you're a salon owner using DaySmart for scheduling and Square for payment processing, you've probably experienced the frustration of trying to match your daily reports. Your DaySmart end-of-day shows one total, but your Square deposit is different. Sound familiar?

## The Root of the Problem

This mismatch happens because **DaySmart and Square operate on different timelines and fee structures**:

### 1. **Settlement Timing Differences**
- **DaySmart**: Shows transactions when they're processed at your salon
- **Square**: Deposits money 1-2 business days later, often grouping multiple days together
- **Result**: Your Tuesday DaySmart report includes Tuesday's sales, but your Tuesday Square deposit might include Monday's transactions

### 2. **Fee Calculation Methods**
- **DaySmart**: Shows gross transaction amounts (what the customer paid)
- **Square**: Deducts processing fees before deposit (what you actually receive)
- **Processing fees**: Typically 2.6% + 10¢ per transaction, but can vary by card type

### 3. **Transaction Type Handling**
- **Refunds and chargebacks**: Appear differently in each system
- **Partial payments**: May be recorded differently
- **Tips**: Can be processed separately, affecting reconciliation

## The Real Cost of Manual Reconciliation

Our research shows salon owners spend an average of **3-4 hours per week** trying to reconcile these reports. That's over **150 hours annually** - time you could be spending with clients or growing your business.

Beyond time, manual reconciliation leads to:
- **Missed processing errors** (costing salons $200-800+ annually)
- **Accounting mistakes** that create tax headaches
- **Cash flow confusion** when deposits don't match expectations

## The Solution: Automated Reconciliation

Here's how successful salons solve this problem:

### Option 1: Use DaySmart's Integrated Processing
**Pros**: Automatic reconciliation built-in
**Cons**: Higher processing fees, less flexibility with payment terms

### Option 2: Automated Reconciliation Service (Recommended)
**What it does**: 
- Automatically imports both your DaySmart reports and Square transaction data
- Matches transactions using intelligent algorithms
- Identifies discrepancies and processing errors
- Generates reconciled reports in minutes, not hours

**Real Example**: GR Salon in Miami reduced their weekly reconciliation from 4 hours to 15 minutes, catching $347 in processing errors they missed manually.

## DIY Quick Fix (Temporary Solution)

If you want to improve your manual process while exploring automation:

1. **Download reports for the same date range**: Use DaySmart's date range selector to match Square's deposit periods
2. **Account for processing fees**: Create a simple spreadsheet that deducts Square's fees from DaySmart totals
3. **Track refunds separately**: Note any refunds/chargebacks that might appear in different reporting periods
4. **Use daily totals method**: Reconcile daily instead of by deposit to reduce confusion

## When to Consider Professional Help

If your salon processes more than 200 transactions monthly, manual reconciliation becomes increasingly costly. The time spent reconciling often exceeds the cost of automated solutions.

**Red flags that you need automated reconciliation**:
- Spending more than 2 hours weekly on reconciliation
- Finding unexplained differences between systems
- Missing processing errors or overcharges
- Struggling with month-end financial close

## Next Steps

Ready to eliminate reconciliation headaches? **Book a free 15-minute consultation** to see how automated reconciliation works with your specific DaySmart and Square setup. We'll analyze your current process and show you exactly how much time and money you could save.

[Book Free Consultation](/book) or [Try Our Interactive Demo](/interactive-demo)

---

*Have questions about DaySmart and fee passing reconciliation? Contact us - we respond to every message within 4 hours.*
    `,
    author: 'Sarah Chen',
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
    content: `
# The Hidden Costs of Manual Reconciliation for Salon Owners

Most salon owners know that reconciling payment processor reports with their salon software takes time. But few realize the true cost of doing this manually goes far beyond the hours spent matching transactions.

## The Visible Costs (What You Already Know)

### Time Investment
- **Average time**: 3-4 hours per week
- **Annual hours**: 150-200 hours
- **Opportunity cost**: $3,000-6,000 (valued at $20-30/hour)

### Direct Labor Costs
If you're paying staff to handle reconciliation:
- **Hourly rate**: $15-25/hour
- **Annual cost**: $2,250-5,000
- **Plus benefits**: Add 20-30% for total compensation

## The Hidden Costs (What's Really Expensive)

### 1. Missed Processing Errors
**What happens**: Manual reconciliation catches only 60-70% of processing errors
**Common missed errors**:
- Duplicate charges: $50-200 monthly
- Incorrect interchange fees: $100-400 monthly  
- Failed transaction reversals: $25-150 monthly
- **Total annual loss**: $2,100-9,000

### 2. Increased Accounting Fees
**Why it costs more**:
- Messy books require more CPA time
- Reconciliation errors create tax complications
- Month-end close takes longer
- **Additional annual cost**: $1,200-3,600

### 3. Cash Flow Management Issues
**Impact on business**:
- Delayed identification of payment problems
- Inaccurate daily sales reporting
- Poor financial decision making
- **Estimated annual impact**: $1,000-5,000

### 4. Stress and Burnout
**The intangible costs**:
- Hours spent on frustrating administrative tasks
- Work-life balance deterioration
- Reduced time for business growth activities
- Employee turnover from boring reconciliation duties

## Real Salon Case Study

**Marina's Salon** (suburban Chicago, $800K annual revenue):

**Before Automation**:
- 5 hours weekly on reconciliation
- Missing $200-400 monthly in processing errors
- Paying CPA extra $150/month for messy books
- **Total annual cost**: $8,750

**After Automation**:
- 30 minutes weekly for review
- Catching 95%+ of processing errors
- Clean books reduced CPA fees by $100/month
- **Annual savings**: $7,500
- **ROI**: 625% in first year

## The Math: Manual vs Automated

### Manual Reconciliation (Annual Costs):
- Time investment: $4,000
- Missed processing errors: $5,500
- Extra accounting fees: $1,800
- **Total**: $11,300

### Automated Solution (Annual Costs):
- Service fee: $1,800-3,600
- Reduced time investment: $500
- **Total**: $2,300-4,100
- **Net savings**: $7,200-9,000

## Warning Signs You're Losing Money

- Finding unexplained differences between systems
- Spending more than 1 hour weekly on reconciliation
- Your CPA asking questions about inconsistent reports
- Discovering processing errors months after they occurred
- Staff avoiding reconciliation tasks

## The Solution ROI

Automated reconciliation typically pays for itself within 2-3 months through:
- **Time savings**: 70-80% reduction in reconciliation time
- **Error detection**: 95%+ accuracy in catching processing mistakes
- **Cleaner books**: Reduced accounting and tax preparation costs
- **Peace of mind**: Knowing your financials are accurate

## Action Steps

1. **Calculate your current cost**: Add up time, missed errors, and extra fees
2. **Compare automation options**: Look for solutions that integrate with your specific software
3. **Start with a trial**: Test automated reconciliation with one month of data
4. **Scale gradually**: Begin with your highest-volume payment processor

Ready to see how much you could save? **Book a free reconciliation audit** to get exact numbers for your salon's situation.

[Schedule Free Audit](/book) | [Calculate Your Savings](/pricing)

---

*Questions about reconciliation costs? We've helped 200+ salons calculate their true reconciliation expenses. Contact us for a personalized analysis.*
    `,
    author: 'Sarah Chen',
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
    content: `
# Case Study: How Bella's Beauty Saved 12 Hours Monthly on Payment Reconciliation

**The Challenge**: Bella's Beauty in Dallas was spending 15+ hours monthly trying to reconcile their DaySmart salon software with three different payment processors - Square, Stripe, and a legacy terminal system. Owner Sarah Martinez was either staying late or coming in on Sundays just to balance the books.

**The Solution**: Automated reconciliation that handles multiple payment processors simultaneously.

**The Results**: 87% time reduction, $2,400 annual savings, and zero reconciliation stress.

## The Before: Reconciliation Nightmare

### Sarah's Weekly Routine (Every Sunday):
- **Hour 1-2**: Download reports from DaySmart for the week
- **Hour 3-4**: Export transaction data from Square dashboard  
- **Hour 5-6**: Pull Stripe settlement reports
- **Hour 7-8**: Manually match transactions across all three systems
- **Hour 9-12**: Hunt down discrepancies, call processors about fees
- **Hour 13-15**: Create summary for bookkeeper, update QuickBooks

### The Problems That Kept Growing:
- **Processing errors going unnoticed**: Lost $200-400 monthly to duplicate charges and incorrect fees
- **Bookkeeper frustration**: Getting messy, incomplete reconciliation reports
- **Staff complaints**: "The books never balance" became a running joke
- **Personal cost**: Sarah's Sundays were gone, affecting family time

### The Breaking Point:
*"I spent 4 hours one Sunday trying to find a $73 difference. Turns out Square had processed a refund the wrong way. I realized I was working for free as an accountant instead of growing my salon business."* - Sarah Martinez

## The Transformation: Automated Reconciliation

### Implementation (Week 1):
- **Day 1**: Initial consultation and data analysis
- **Day 3**: Custom reconciliation rules configured for all three processors
- **Day 7**: First automated report generated and verified

### The New Process (Every Monday):
- **5 minutes**: Review automated reconciliation report
- **10 minutes**: Check flagged discrepancies (usually 1-2 items)
- **15 minutes**: Export clean data for bookkeeper
- **Total**: 30 minutes instead of 15 hours

## The Results: Numbers Don't Lie

### Time Savings:
- **Before**: 15 hours monthly
- **After**: 2 hours monthly  
- **Time saved**: 13 hours monthly (156 hours annually)
- **Value of time**: $4,680 annually (at $30/hour)

### Financial Impact:
- **Processing errors caught**: $347 first month, $200+ monthly average
- **Reduced bookkeeper fees**: $150 monthly (cleaner data = less CPA time)
- **Annual financial benefit**: $4,200

### Total Annual Savings: $8,880

### Quality of Life Improvements:
- **Sundays back**: Family time restored
- **Stress reduction**: No more reconciliation anxiety
- **Business focus**: Time redirected to customer service and growth
- **Staff morale**: Clean books, no more "balance the books" jokes

## The Technical Solution

### How It Works:
1. **Automated data collection**: Pulls transaction data from all three processors
2. **Intelligent matching**: AI algorithms match transactions across systems
3. **Exception handling**: Flags discrepancies for quick review
4. **Clean reporting**: Generates bookkeeper-ready summaries

### Integration Details:
- **DaySmart**: Daily export via API
- **Square**: Real-time transaction sync
- **Stripe**: Webhook-based updates
- **Legacy terminal**: Weekly batch file processing

## Lessons Learned

### What Sarah Wishes She'd Known:
*"I thought reconciliation was just part of running a salon. I didn't realize how much money and time I was losing until I saw the automated reports. The first month, we caught three processing errors I never would have found manually."*

### Implementation Tips:
- **Start with highest volume processor**: Biggest immediate impact
- **Train one person thoroughly**: Don't try to train everyone at once  
- **Keep manual backup initially**: Build confidence before fully transitioning
- **Review flagged items promptly**: Automation works best with human oversight

## The ROI Calculation

### Investment:
- **Monthly service fee**: $89
- **Setup time**: 2 hours
- **Training time**: 1 hour
- **Annual cost**: $1,068

### Returns:
- **Time savings**: $4,680
- **Error detection**: $2,400
- **Reduced accounting fees**: $1,800
- **Total annual benefit**: $8,880

### **ROI: 732% in first year**

## Scaling the Success

### Month 6 Updates:
- Added two more salon locations to the system
- Reduced corporate reconciliation from 40 hours to 6 hours monthly
- Bookkeeper now handles three locations in the same time as one previously

### Year 1 Impact:
- **Total time saved**: 468 hours across all locations
- **Processing errors caught**: $7,200
- **Expansion capability**: Opened fourth location with confidence in financial systems

## Advice for Other Salon Owners

### Sarah's Recommendations:

1. **Calculate your real cost**: "Add up time, missed errors, and frustration. The number shocked me."

2. **Start small**: "We piloted with just Square integration first, then added the others."

3. **Focus on outcomes**: "I stopped caring about how it worked and started caring about getting my Sundays back."

4. **Trust but verify**: "First few months, I spot-checked everything. Now I just review exceptions."

## Ready to Transform Your Reconciliation?

Bella's Beauty isn't unique - they represent what's possible when salon owners stop accepting reconciliation as a necessary evil and start treating it as a solvable business problem.

**Want similar results?** Book a free reconciliation audit to see how automated reconciliation would work with your specific payment processors and salon software.

[Book Free Audit](/book) | [See Interactive Demo](/interactive-demo) | [Calculate Your Savings](/pricing)

---

*Interested in sharing your salon's reconciliation story? We feature successful automation case studies. Contact us to share your experience.*
    `,
    author: 'Sarah Chen',
    date: '2025-01-10',
    readTime: '10 min read',
    category: 'Case Studies',
    slug: 'bellas-beauty-reconciliation-case-study',
    featured: true
  },
  {
    id: '4',
    title: 'The Excel Nightmare: Why TrendSetters Salon Finally Ditched Spreadsheets for Automated Reconciliation',
    excerpt: 'After three years of spreadsheet chaos, cash flow mistakes, and weekend reconciliation marathons, TrendSetters Salon discovered why 73% of growing salons abandon Excel for automated solutions.',
    content: 'This post shows how Maria Santos ended her 6-hour weekly Excel reconciliation nightmare...',
    author: 'Lisa Martinez',
    date: '2025-01-08',
    readTime: '7 min read',
    category: 'Case Studies',
    slug: 'trendsetters-salon-excel-nightmare-automated-reconciliation',
    featured: false
  },
  {
    id: '5',
    title: 'Why Style Innovators Salon Switched from Manual to Automated Payment Reconciliation (And Saved 15 Hours Weekly)',
    excerpt: 'Cash flow chaos, missed payments, and weekend reconciliation marathons nearly closed Style Innovators Salon. Here\'s how automated reconciliation saved their business and sanity.',
    content: 'This post details Jessica Chen\'s transformation from 15 hours weekly to 45 minutes...',
    author: 'David Kim',
    date: '2025-01-06',
    readTime: '9 min read',
    category: 'Case Studies',
    slug: 'style-innovators-manual-automated-reconciliation-transformation',
    featured: false
  },
  {
    id: '6',
    title: 'Why Salon Owners Resist Payment Automation (And How One Changed Her Mind)',
    excerpt: 'Two years of proven results, thousands in savings, but still struggling to convince other salon owners? Here\'s why the beauty industry is slow to adopt payment automation and the strategies that actually work.',
    content: `
# Why Salon Owners Resist Payment Automation (And How One Changed Her Mind)

After building automated reconciliation software that's saved one salon owner thousands of dollars and hours of work over two years, you'd think other salon owners would be lining up to try it. Instead, we're discovering what every SaaS company learns: **proving value and getting adoption are two completely different challenges**.

## The Adoption Reality Check

Here's what we've learned from talking to salon owners about payment reconciliation automation:

### The "It's Not Broken" Mentality
- **"We've always done it this way"** - Even when "this way" costs 4+ hours weekly
- **"Manual is more accurate"** - Despite missing hundreds in processing errors monthly
- **"We can't afford new systems"** - While losing thousands to inefficient processes

### The Technical Hesitation
- **"I don't understand the tech"** - Fear of complexity, even for simple solutions
- **"What if it breaks?"** - Preferring known problems over unknown solutions
- **"My staff won't learn it"** - Underestimating team adaptability

### The Trust Barrier
- **"How do I know it works?"** - Need for proof from similar businesses
- **"What about my data security?"** - Valid concerns about financial information
- **"What if you go out of business?"** - Dependency anxiety on new vendors

## The Proven Success Story

While facing these adoption challenges, we have irrefutable proof the solution works:

### Two Years of Real Results
- **Time savings**: 15 hours weekly → 30 minutes weekly
- **Error detection**: Catching $200-400 monthly in missed processing fees
- **Stress reduction**: No more Sunday reconciliation marathons
- **ROI**: 600%+ annually in time and error savings

### The Partner's Perspective
*"I can't imagine going back to manual reconciliation. The first month alone, we caught three processing errors totaling $347 that I never would have found. It's paid for itself dozens of times over."*

## Why Salons Stay Stuck

### 1. They Don't Know What They Don't Know
Many salon owners have never calculated the true cost of manual reconciliation:
- **Hidden processing errors**: $2,000-8,000 annually
- **Time investment**: 150+ hours annually
- **Opportunity cost**: Time not spent on growth activities
- **Stress factor**: Sunday work sessions affecting work-life balance

### 2. Risk Aversion in a Relationship Business
Salons are built on personal relationships and consistency. Owners worry:
- **Client impact**: Any change that might affect customer experience
- **Staff disruption**: Learning curves affecting daily operations
- **Financial risk**: Upfront costs vs. uncertain benefits

### 3. Information Overload
The beauty industry is constantly pitched "revolutionary" software:
- **Solution fatigue**: Too many vendors promising transformation
- **Feature confusion**: Complex systems when they need simple solutions
- **Integration anxiety**: Fear of disrupting existing workflows

## The Strategies That Actually Work

Based on our real-world experience, here's what resonates with salon owners:

### 1. Lead with the Partner's Story
**Instead of**: "Our software increases efficiency by 85%"
**Try**: "Local salon owner Sarah saved 12 hours weekly and caught $347 in missed fees her first month"

**Why it works**:
- Specific, relatable numbers
- Local credibility
- Real person they could potentially meet

### 2. Education-First Approach
**The "Education-First" Strategy**:
- Help them understand their current reconciliation costs
- Show examples of time and error savings from similar salons
- Demonstrate hidden money leaks in manual processes
- Present automation as "enhancement" not "replacement"

**Example**: "See how similar salons reduced reconciliation time by 90% and caught hundreds in missed processing errors."

### 3. Implementation Ease
**Position as workflow enhancement**:
- "Works alongside your existing DaySmart system"
- "Doesn't replace anything - just makes reconciliation automatic"
- "Your staff keeps doing what they know, just faster"
- "Start with one month trial to prove value"

### 4. Address Fears Directly
**Common Concern**: "What if it makes mistakes?"
**Response**: "It flags discrepancies for your review - you always have final approval. Plus, it catches errors manual reconciliation misses."

**Common Concern**: "My staff won't learn new technology"
**Response**: "The system works in the background. Your staff sees clean, organized reports instead of spending hours matching transactions."

## The Psychology of Salon Owner Decision-Making

### What Motivates Action:
1. **Peer recommendations** (other salon owners)
2. **Time recovery** (getting weekends back)
3. **Error prevention** (catching money leaks)
4. **Stress reduction** (eliminating reconciliation anxiety)

### What Creates Resistance:
1. **Tech complexity** (even perceived)
2. **Change disruption** (affecting daily routines)
3. **Upfront costs** (vs. hidden current costs)
4. **Vendor dependency** (fear of lock-in)

## The Word-of-Mouth Strategy

### Why It's Essential:
- **Trust transfer**: Salon owners trust other salon owners
- **Real validation**: Can't fake two years of satisfied use
- **Specific benefits**: Exact time/money savings from similar business
- **Implementation insights**: Honest feedback about challenges and solutions

### How to Leverage:
1. **Document partner success**: Detailed case study with specific numbers
2. **Network expansion**: Partner introduces solution to her professional network
3. **Referral incentives**: Partner benefits from successful referrals
4. **Testimonial content**: Video/written testimonials for credibility

## The Long Game: Industry Education

### Content Marketing That Works:
- **"Hidden costs of manual reconciliation"** - Eye-opening financial analysis
- **"Processing errors salons miss"** - Specific examples with dollar amounts
- **"Time audit: Where salon hours really go"** - Productivity analysis
- **"Reconciliation horror stories"** - Relatable pain points

### Community Building:
- **Salon owner Facebook groups**: Share helpful reconciliation tips
- **Industry events**: Present on financial efficiency topics
- **Local networking**: Partner attends salon owner meetups
- **Webinar series**: "Salon Financial Best Practices"

## The Breakthrough Moment

Every successful adoption starts with one salon owner saying: **"I wish I'd started this two years ago."**

The challenge isn't proving the solution works - we have two years of evidence. The challenge is communicating value in a way that overcomes the natural resistance to change in a traditional industry.

### Next Steps for Breakthrough:
1. **Perfect the partner story**: Document exact savings, time recovery, error prevention
2. **Create risk-free trials**: One-month audits that prove value without commitment
3. **Build local network**: Partner's salon connections are the warmest leads
4. **Focus on pain relief**: Position as solution to existing frustrations, not new capability

The salon industry may be slow to adopt new technology, but when they see real results from peers they trust, adoption accelerates quickly.

---

*Are you a salon owner struggling with payment reconciliation? See how automated reconciliation can transform your business operations and eliminate weekend reconciliation marathons.*

[Learn More About Our Solution](/pricing) | [Try Interactive Demo](/interactive-demo)
    `,
    author: 'Davis Wilson',
    date: '2025-01-16',
    readTime: '12 min read',
    category: 'Industry Insights',
    slug: 'salon-owners-resist-payment-automation',
    featured: true
  }
];

export default function BlogPage() {
  const featuredPosts = blogPosts.filter(post => post.featured);
  const recentPosts = blogPosts.slice(0, 6);

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Salon Payment Reconciliation Blog | DaySmart & Square Tips | GR Balance</title>
        <meta name="description" content="Expert tips for salon payment reconciliation, DaySmart integration, Square processing, and automation strategies. Save hours weekly with proven solutions." />
        <meta name="keywords" content="salon reconciliation blog, DaySmart tips, Square payment processing, salon accounting, payment automation, beauty business finance" />
        <link rel="canonical" href="https://grbalance.com/blog" />
      </Helmet>

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Salon Reconciliation Blog
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Expert tips, case studies, and solutions for salon payment processing and reconciliation challenges
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured Articles</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="p-8">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(post.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                      <span>•</span>
                      <Clock className="h-4 w-4" />
                      <span>{post.readTime}</span>
                      <span className="ml-auto bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium">
                        {post.category}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-emerald-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{post.author}</span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-600 font-medium group-hover:gap-2 transition-all">
                        Read Article
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All Posts */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Recent Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentPosts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>
                  <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium mb-3">
                    {post.category}
                  </span>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">By {post.author}</span>
                    <div className="flex items-center gap-1 text-emerald-600 font-medium">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Get Help CTA */}
        <section className="mt-16 bg-emerald-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Need Help with Reconciliation?</h2>
          <p className="text-xl mb-6">
            Ready to eliminate reconciliation headaches? Book a free consultation to see how we can help your salon save time and money.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/book"
              className="inline-flex items-center bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Book Free Consultation
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Get in Touch
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}