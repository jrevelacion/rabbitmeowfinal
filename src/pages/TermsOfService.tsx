import { AnimatePresence } from "framer-motion";
import Ads from '@/components/Ads';
import { useUserPreferences } from '@/hooks/user-preferences';

const TermsOfService = () => {
  const { userPreferences } = useUserPreferences();
  return (
    <div>
      <AnimatePresence mode="wait">
        <div className="container mx-auto p-4 prose prose-invert max-w-4xl">
          <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
          
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold text-yellow-500 mb-2">Educational Demonstration Notice</h2>
            <p className="text-white/80">
              This application is strictly an educational demonstration project. We do not host, store, or distribute any media content. 
              All content is fetched from third-party APIs for demonstration purposes only.
            </p>
          </div>

          <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing and using this educational demonstration, you accept and agree to be bound by these Terms of Service. 
            If you do not agree to these terms, please do not use this application.
          </p>

          <h2 className="text-2xl font-semibold mb-3">2. Service Description</h2>
          <p className="mb-4">
            This is a frontend demonstration project that interfaces with third-party APIs to showcase programming concepts and techniques. 
            The service may be discontinued at any time without notice.
          </p>

          <h2 className="text-2xl font-semibold mb-3">3. Disclaimer of Responsibility</h2>
          <p className="mb-4">
            We are not responsible for any content displayed through third-party APIs. We do not verify, endorse, or take responsibility 
            for any content shown through our demonstration interface.
          </p>

          <h2 className="text-2xl font-semibold mb-3">4. Third-Party Content</h2>
          <p className="mb-4">
            All media content displayed is sourced from third-party APIs. Rights to such content belong to their respective owners. 
            We do not claim ownership of any media content displayed through our interface.
          </p>

          <h2 className="text-2xl font-semibold mb-3">5. No Warranties</h2>
          <p className="mb-4">
            This service is provided "as is" without any warranties of any kind. We do not guarantee the availability, accuracy, 
            or continuity of the service as this is purely for educational demonstration.
          </p>

          <h2 className="text-2xl font-semibold mb-3">6. Limitation of Liability</h2>
          <p className="mb-4">
            We shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from the use 
            or inability to use this educational demonstration.
          </p>

          <h2 className="text-2xl font-semibold mb-3">7. Changes to Terms</h2>
          <p className="mb-4">
            We reserve the right to modify these terms at any time without prior notice. Continued use of the service after any 
            such changes constitutes your acceptance of the new terms.
          </p>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-6">
            <p className="text-white/80">
              Last updated: March 26, 2025
            </p>
          </div>
        </div>
      </AnimatePresence>
{userPreferences?.adsEnabled && <Ads />}    </div>
  );
};

export default TermsOfService;