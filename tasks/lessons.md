## Pattern: Real Scannable QR Codes for Event Check-in Demos
- **Date**: 2026-09-15
- **Mistake**: Using decorative/mock SVG matrix for ticket QR codes instead of real, camera-scannable dynamic QR codes.
- **Root Cause**: Assumed visual representation was sufficient for a kickoff demo without implementing dynamic QR generation and camera-to-URL validation.
- **Rule**: In any event check-in / ticket / lucky draw landing page, ALWAYS generate real scannable QR codes with valid verification query parameters, ensure zero-dependency client-side generation, support canvas export with scannable QR, and provide a dedicated shareable high-res QR for client demo pitching.
