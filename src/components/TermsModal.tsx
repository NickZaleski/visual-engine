import { useState } from 'react';

export function TermsModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Link */}
      <button
        onClick={() => setIsOpen(true)}
        className="text-[10px] text-cosmic-500 hover:text-cosmic-300 
                   transition-colors duration-300 opacity-60 hover:opacity-100"
      >
        Terms & Conditions
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-cosmic-900/90 backdrop-blur-md p-4"
          onClick={() => setIsOpen(false)}
        >
          {/* Modal Content */}
          <div 
            className="relative w-full max-w-2xl max-h-[85vh] glass rounded-2xl overflow-hidden shadow-2xl shadow-cosmic-900/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-cosmic-800/50 
                         flex items-center justify-center text-cosmic-400 hover:text-white 
                         hover:bg-cosmic-700/50 transition-all duration-200 z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-cosmic-600/20">
              <h2 className="text-xl font-display font-bold text-white tracking-wide">
                Terms & Conditions
              </h2>
              <p className="mt-1 text-xs text-cosmic-400">
                Last updated: December 31, 2024
              </p>
            </div>

            {/* Scrollable Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-[60vh] space-y-6 text-sm text-cosmic-300 leading-relaxed">
              
              {/* Introduction */}
              <section>
                <h3 className="text-base font-display font-semibold text-white mb-2">
                  1. Introduction
                </h3>
                <p>
                  Welcome to Calm Down Space ("we," "our," or "us"). By accessing or using our visual meditation 
                  application and related services (collectively, the "Service"), you agree to be bound by these 
                  Terms and Conditions ("Terms"). Please read them carefully before using our Service.
                </p>
              </section>

              {/* Acceptance of Terms */}
              <section>
                <h3 className="text-base font-display font-semibold text-white mb-2">
                  2. Acceptance of Terms
                </h3>
                <p>
                  By creating an account, subscribing to our Service, or otherwise using Calm Down Space, you 
                  acknowledge that you have read, understood, and agree to be bound by these Terms. If you do 
                  not agree to these Terms, you may not access or use the Service.
                </p>
              </section>

              {/* Description of Service */}
              <section>
                <h3 className="text-base font-display font-semibold text-white mb-2">
                  3. Description of Service
                </h3>
                <p className="mb-2">
                  Calm Down Space is a visual meditation and focus tool designed to help users relax, 
                  concentrate, and enter a flow state. The Service includes:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-cosmic-400">
                  <li>Interactive visual experiences and animations</li>
                  <li>Ambient soundscapes and binaural frequencies</li>
                  <li>Focus timers and session management</li>
                  <li>Customization options for colors and visual modes</li>
                  <li>Premium features available through paid subscriptions</li>
                </ul>
              </section>

              {/* User Accounts */}
              <section>
                <h3 className="text-base font-display font-semibold text-white mb-2">
                  4. User Accounts
                </h3>
                <p className="mb-2">
                  To access certain features of the Service, you may need to create an account. You agree to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-cosmic-400">
                  <li>Provide accurate and complete registration information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Promptly notify us of any unauthorized use of your account</li>
                  <li>Accept responsibility for all activities that occur under your account</li>
                </ul>
              </section>

              {/* Subscription and Payments */}
              <section>
                <h3 className="text-base font-display font-semibold text-white mb-2">
                  5. Subscription and Payments
                </h3>
                <p className="mb-2">
                  <strong className="text-cosmic-200">5.1 Free Tier:</strong> We offer a free tier with limited features. 
                  Free users may access basic visual modes and sounds.
                </p>
                <p className="mb-2">
                  <strong className="text-cosmic-200">5.2 Premium Subscription:</strong> Premium features are available 
                  through monthly or yearly subscription plans. Subscription fees are billed in advance on a recurring 
                  basis.
                </p>
                <p className="mb-2">
                  <strong className="text-cosmic-200">5.3 Payment Processing:</strong> All payments are processed securely 
                  through Stripe. By subscribing, you authorize us to charge your payment method for the subscription 
                  fees.
                </p>
                <p>
                  <strong className="text-cosmic-200">5.4 Cancellation:</strong> You may cancel your subscription at any 
                  time. Cancellation will take effect at the end of your current billing period. No refunds will be 
                  provided for partial billing periods.
                </p>
              </section>

              {/* Intellectual Property */}
              <section>
                <h3 className="text-base font-display font-semibold text-white mb-2">
                  6. Intellectual Property
                </h3>
                <p>
                  All content, features, and functionality of the Service, including but not limited to visual 
                  designs, animations, audio content, software code, and trademarks, are owned by Calm Down Space 
                  or its licensors and are protected by intellectual property laws. You may not reproduce, 
                  distribute, modify, or create derivative works without our express written permission.
                </p>
              </section>

              {/* Acceptable Use */}
              <section>
                <h3 className="text-base font-display font-semibold text-white mb-2">
                  7. Acceptable Use
                </h3>
                <p className="mb-2">You agree not to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-cosmic-400">
                  <li>Use the Service for any unlawful purpose</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with or disrupt the Service</li>
                  <li>Reverse engineer or decompile any part of the Service</li>
                  <li>Share your account credentials with others</li>
                  <li>Use automated systems to access the Service without permission</li>
                </ul>
              </section>

              {/* Health Disclaimer */}
              <section>
                <h3 className="text-base font-display font-semibold text-white mb-2">
                  8. Health Disclaimer
                </h3>
                <p className="mb-2">
                  <strong className="text-cosmic-200">Important:</strong> Calm Down Space is designed for relaxation 
                  and focus enhancement. However:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-cosmic-400">
                  <li>The Service is not a substitute for professional medical advice, diagnosis, or treatment</li>
                  <li>Some visual effects may not be suitable for individuals with photosensitive epilepsy</li>
                  <li>Binaural frequencies should not be used while driving or operating machinery</li>
                  <li>Consult a healthcare professional if you have concerns about using the Service</li>
                </ul>
              </section>

              {/* Limitation of Liability */}
              <section>
                <h3 className="text-base font-display font-semibold text-white mb-2">
                  9. Limitation of Liability
                </h3>
                <p>
                  To the maximum extent permitted by law, Calm Down Space shall not be liable for any indirect, 
                  incidental, special, consequential, or punitive damages, or any loss of profits or revenues, 
                  whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible 
                  losses resulting from your use of the Service.
                </p>
              </section>

              {/* Disclaimer of Warranties */}
              <section>
                <h3 className="text-base font-display font-semibold text-white mb-2">
                  10. Disclaimer of Warranties
                </h3>
                <p>
                  The Service is provided "as is" and "as available" without warranties of any kind, either express 
                  or implied, including but not limited to implied warranties of merchantability, fitness for a 
                  particular purpose, and non-infringement. We do not warrant that the Service will be uninterrupted, 
                  secure, or error-free.
                </p>
              </section>

              {/* Modifications to Terms */}
              <section>
                <h3 className="text-base font-display font-semibold text-white mb-2">
                  11. Modifications to Terms
                </h3>
                <p>
                  We reserve the right to modify these Terms at any time. We will notify users of any material 
                  changes by posting the updated Terms on our website or through the Service. Your continued use 
                  of the Service after such modifications constitutes your acceptance of the updated Terms.
                </p>
              </section>

              {/* Termination */}
              <section>
                <h3 className="text-base font-display font-semibold text-white mb-2">
                  12. Termination
                </h3>
                <p>
                  We may terminate or suspend your access to the Service immediately, without prior notice or 
                  liability, for any reason, including if you breach these Terms. Upon termination, your right 
                  to use the Service will immediately cease.
                </p>
              </section>

              {/* Governing Law */}
              <section>
                <h3 className="text-base font-display font-semibold text-white mb-2">
                  13. Governing Law
                </h3>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the United States, 
                  without regard to its conflict of law provisions. Any disputes arising from these Terms or your 
                  use of the Service shall be resolved in the courts of competent jurisdiction.
                </p>
              </section>

              {/* Contact Information */}
              <section>
                <h3 className="text-base font-display font-semibold text-white mb-2">
                  14. Contact Information
                </h3>
                <p>
                  If you have any questions about these Terms, please contact us through our support channels 
                  available on the Calm Down Space website.
                </p>
              </section>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-cosmic-600/20 bg-cosmic-800/20">
              <div className="flex items-center justify-between">
                <p className="text-xs text-cosmic-500">
                  By using Calm Down Space, you agree to these terms.
                </p>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg bg-nebula-purple/20 border border-nebula-purple/30
                             text-sm text-white font-medium
                             hover:bg-nebula-purple/30 hover:border-nebula-purple/50
                             transition-all duration-200"
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

