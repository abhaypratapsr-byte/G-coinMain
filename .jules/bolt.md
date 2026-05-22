
## 2025-05-14 - Blockchain RPC and Mongoose Query Optimization
**Learning:** Redundant RPC calls for static contract data (like decimals) can significantly slow down blockchain interactions. Mongoose's .lean() is essential for read-heavy endpoints to bypass heavy document hydration.
**Action:** Always cache static contract constants and use .lean() for list/history endpoints to improve API responsiveness.
