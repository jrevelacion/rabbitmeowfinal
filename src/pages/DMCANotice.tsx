import { AnimatePresence } from "framer-motion";
import Ads from '@/components/Ads';
import { useUserPreferences } from '@/hooks/user-preferences';

const DMCANotice = () => {
  const { userPreferences } = useUserPreferences();
  return (
    <>
      <AnimatePresence mode="wait">
        <div className="container mx-auto p-4 prose prose-invert max-w-4xl">
          <h1 className="text-3xl font-bold mb-4">DMCA Notice</h1>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold text-yellow-500 mb-2">Important Notice</h2>
            <p className="text-white/80">
              This is an educational demonstration project that does not host any content. All content is fetched from third-party APIs. 
              DMCA notices should be directed to the respective content owners or hosting services.
            </p>
          </div>

          <h2 className="text-2xl font-semibold mb-3">Our Role</h2>
          <p className="mb-4">
            This application is a frontend demonstration that:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Does not host or store any media content</li>
            <li>Uses third-party APIs for educational purposes only</li>
            <li>Has no control over the content provided by these APIs</li>
            <li>May be discontinued at any time</li>
          </ul>

          <h2 className="text-2xl font-semibold mb-3">Third-Party Content</h2>
          <p className="mb-4">
            For any copyright concerns:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Identify the specific content in question</li>
            <li>Contact the actual hosting service or content owner</li>
            <li>Submit DMCA notices to the appropriate content provider</li>
          </ul>

          <h2 className="text-2xl font-semibold mb-3">Contact Information</h2>
          <p className="mb-4">
            While we do not host content, if you have questions about our educational demonstration, contact us at:
            <br />
            Email: flickystream@proton.me
          </p>

          <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4 mb-6">
            <h3 className="text-xl font-semibold mb-2">Disclaimer</h3>
            <p className="text-white/80">
              We are not responsible for any content displayed through third-party APIs. This is purely an educational 
              demonstration of frontend development techniques.
            </p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-6">
            <p className="text-white/80">
              Last updated: March 26, 2025
            </p>
          </div>
        </div>
      </AnimatePresence>
      {userPreferences?.adsEnabled && <Ads />}
    </>
  );
};

export default DMCANotice;