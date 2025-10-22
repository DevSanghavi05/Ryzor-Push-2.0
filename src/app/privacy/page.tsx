
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6 pt-24">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Privacy Policy for Ryzor AI</CardTitle>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p>This Privacy Policy describes how Ryzor AI ("we," "our," or "us") collects, uses, and discloses your information when you use our application (the "Service") and explains your privacy rights. By using the Service, you agree to the collection and use of information in accordance with this policy.</p>
          <p>Our Service is hosted at <a href="https://ryzor.pro">ryzor.pro</a>, and this policy applies to all interactions with the Service on that domain.</p>
          
          <h2>1. Information We Collect</h2>
          <p>We collect information necessary to provide and improve our Service. This includes data you provide directly and data collected automatically.</p>
          
          <h3>Personal Data (via Google OAuth)</h3>
          <p>When you sign in using Google, we request your permission to access certain information from your Google Account. This includes:</p>
          <ul>
            <li><strong>Basic Profile Information:</strong> Your name, email address, and profile picture. This is used to create and manage your Ryzor AI account and personalize your experience.</li>
            <li><strong>Google Drive Files (Read-Only):</strong> We request read-only access to your Google Drive files (`https://www.googleapis.com/auth/drive.readonly`) to list them within our interface. We do not store your files on our servers.</li>
            <li><strong>Google Docs Content (Read-Only):</strong> When you explicitly choose to analyze a Google Doc, we request read-only access (`https://www.googleapis.com/auth/documents.readonly`) to extract its text content for on-demand analysis. This content is processed to answer your questions but is not permanently stored on our servers.</li>
          </ul>
          
          <h3>Uploaded Documents</h3>
          <p>When you upload documents (e.g., PDFs) to the Service, the content is stored securely in your browser's local storage to enable the chat functionality. This data does not leave your device and is not stored on our servers.</p>

          <h3>Usage Data</h3>
          <p>We may collect Usage Data automatically when you use the Service. This may include your device's IP address, browser type, pages visited, time and date of visit, and other diagnostic data to help us improve service reliability and performance.</p>
          
          <h2>2. How We Use Your Information</h2>
          <p>Ryzor AI uses the collected data for the following purposes:</p>
          <ul>
            <li><strong>To Provide and Maintain our Service:</strong> This includes managing your account, providing access to your files for analysis, and enabling the core chat functionality.</li>
            <li><strong>To Improve the Service:</strong> We analyze usage patterns to understand how our Service is used, identify potential issues, and make improvements.</li>
            <li><strong>To Communicate with You:</strong> We may use your email address to contact you regarding your account or important updates to the Service.</li>
          </ul>

          <h2>3. Data Storage and Security</h2>
          <p>Your security is our priority. Here is how we handle your data:</p>
          <ul>
            <li><strong>Google User Data:</strong> Your Google profile information is managed by Firebase Authentication. We do not store your Google Drive files. Text content from Google Docs is fetched for real-time analysis and is not permanently stored.</li>
            <li><strong>Uploaded Files:</strong> Content from uploaded PDFs is stored directly in your browser's local storage and is not transmitted to or stored on our servers.</li>
            <li><strong>Security Measures:</strong> We use industry-standard security measures, including HTTPS, to protect data in transit. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.</li>
          </ul>

          <h2>4. Sharing Your Information</h2>
          <p>We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. Your data is used solely for the purpose of providing and improving the Ryzor AI service.</p>

          <h2>5. Changes to This Privacy Policy</h2>
          <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. If we make material changes to how we handle your Google user data, we will notify you through the Service or by email to obtain your consent if required by law.</p>

          <h2>6. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us. (Note: A contact method would be provided in a full production application).</p>
        </CardContent>
      </Card>
    </div>
  );
}

    