/**
 * Vercel Speed Insights Initialization
 * 
 * This script initializes the Speed Insights tracking for the Clipency platform.
 * It sets up the speed insights queue and loads the Vercel Speed Insights script.
 * 
 * Documentation: https://vercel.com/docs/speed-insights/quickstart
 */

(function() {
  // Initialize the Speed Insights queue
  window.si = window.si || function() {
    (window.siq = window.siq || []).push(arguments);
  };
})();
