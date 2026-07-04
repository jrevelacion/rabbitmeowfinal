import { AnimatePresence } from "framer-motion";
import Ads from '@/components/Ads';

const PrivacyPolicy = () => {
  return (
    <>
      <AnimatePresence mode="wait">
        <div className="container mx-auto p-4 prose prose-invert max-w-4xl">
          <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold text-blue-500 mb-2">Introduction</h2>
            <p className="text-white/80">
              This Privacy Policy outlines how we handle information in this educational demonstration project. 
              Note that this is a demonstration and does not collect personal data beyond what is necessary for functionality.
            </p>
          </div>

          <h2 className="text-2xl font-semibold mb-3">1. Information We Collect</h2>
          <p className="mb-4">
            As a demonstration:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>We may temporarily store browsing preferences</li>
            <li>No personal identifiable information is permanently stored</li>
            <li>Third-party APIs may collect data per their own policies</li>
          </ul>

          <h2 className="text-2xl font-semibold mb-3">2. How We Use Information</h2>
          <p className="mb-4">
            Information is used solely to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Enhance the demonstration experience</li>
            <li>Showcase frontend development techniques</li>
            <li>No data is sold or shared with third parties beyond API providers</li>
          </ul>

          <h2 className="text-2xl font-semibold mb-3">3. Third-Party Services</h2>
          <p className="mb-4">
            This demo relies on third-party APIs. Please refer to their privacy policies for details on data handling.
          </p>

          <h2 className="text-2xl font-semibold mb-3">4. Changes to This Policy</h2>
          <p className="mb-4">
            We may update this policy at any time. Changes will be reflected on this page.
          </p>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-6">
            <p className="text-white/80">
              Last updated: March 26, 2025
            </p>
          </div>
        </div>
      </AnimatePresence>
      <Ads />
    </>
  );
};

export default PrivacyPolicy;