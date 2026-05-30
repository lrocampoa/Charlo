🧪 Add test for createReservation error path

🎯 **What:** Addressed the testing gap in `src/lib/bookings/bookingService.ts` for the `createReservation` error path. The function's behavior when `checkAvailability` returns false was not covered by tests.
📊 **Coverage:** The scenario where the capacity is reached and availability check fails is now tested by properly mocking the `adminDb` firestore chain calls.
✨ **Result:** Improved test coverage and reliability for `bookingService.ts`. Confirmed the correct error is thrown when there is no availability.
