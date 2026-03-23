# ✅ Frontend Setup Verification Checklist

Use this checklist to verify your frontend is ready for development and deployment.

## Pre-Setup Verification

- [ ] Node.js v16+ installed: `node -v`
- [ ] npm v8+ installed: `npm -v`
- [ ] Freighter wallet installed in browser
- [ ] Git repository initialized (if needed)

## Installation Verification

- [ ] Dependencies installed: `npm install` succeeded
- [ ] No critical vulnerabilities or errors
- [ ] All packages in node_modules/
- [ ] package-lock.json present

## Configuration Verification

- [ ] `.env.local` file created with:
  - [ ] `VITE_SOROBAN_SERVER_URL`
  - [ ] `VITE_CONTRACT_ID`
  - [ ] `VITE_NETWORK=testnet`

## Build Verification

- [ ] Production build succeeds: `npm run build`
- [ ] `dist/` folder created
- [ ] `dist/index.html` present
- [ ] `dist/assets/` contains files
- [ ] Bundle size reasonable (~290 KB gZipped)

## Development Server Verification

- [ ] Dev server starts: `npm run dev`
- [ ] Accessible at http://localhost:5173
- [ ] No console errors
- [ ] Hot module replacement works (change a file, page updates)
- [ ] Styling loads correctly (Tailwind CSS visible)

## UI Component Verification

- [ ] Page title shows "StellaPay"
- [ ] Header displays correctly
- [ ] Wallet connect button visible
- [ ] Two-column layout visible
- [ ] Card components style correctly
- [ ] Colors match Stellar theme

## Wallet Integration Verification

- [ ] "🔑 Connect Wallet" button clickable
- [ ] Clicking connects to Freighter (or shows error if not installed)
- [ ] After connection:
  - [ ] Button changes to "Disconnect"
  - [ ] Public key displays (truncated)
  - [ ] Balance shows in XLM

## Payment Form Verification

- [ ] "💳 Set Last Payment" card visible
- [ ] Form fields present:
  - [ ] Recipient Address input
  - [ ] Amount input
  - [ ] Memo input
  - [ ] Submit Payment button
- [ ] Form validation works:
  - [ ] Submit without data shows errors
  - [ ] Invalid address shows error
  - [ ] Negative amount shows error
  - [ ] Long memo shows error

## Payment Retrieval Verification

- [ ] "📋 Last Payment" card visible
- [ ] "Get Payment" button clickable
- [ ] After clicking (with valid wallet):
  - [ ] Loading state shows
  - [ ] Payment data displays
  - [ ] Refresh button works

## Error Handling Verification

- [ ] Errors display in alert boxes
- [ ] Close button (✕) works on alerts
- [ ] Error messages are helpful
- [ ] No undefined errors in console
- [ ] Failed wallet connection shows message

## Testing Verification

- [ ] Tests run: `npm test`
- [ ] All test suites pass
- [ ] No test errors
- [ ] Can run specific test: `npm test -- utils.test`

## Code Quality Verification

- [ ] No console errors (F12)
- [ ] No console warnings
- [ ] No ESLint errors (if running)
- [ ] Code is formatted consistently
- [ ] JSDoc comments present on functions

## File Structure Verification

- [ ] `src/components/` has 8 files
- [ ] `src/services/` has 2 files
- [ ] `src/contexts/` has WalletContext.jsx
- [ ] `src/hooks/` has index.js
- [ ] `src/utils/` has constants.js and errors.js
- [ ] `src/test/` has 6 test files

## Documentation Verification

- [ ] GETTING_STARTED.md present and readable
- [ ] VITE_PROJECT_README.md present
- [ ] FRONTEND_DOCUMENTATION.md present
- [ ] FILE_REFERENCE.md present
- [ ] BUILD_SUMMARY.md present

## Package.json Verification

- [ ] Name: "stella-pay-dapp"
- [ ] Version: "1.0.0"
- [ ] Scripts include: dev, build, test, preview
- [ ] All dependencies listed
- [ ] All devDependencies listed
- [ ] No missing packages

## Environment Variables Verification

Check `.env.local` file has:
```
VITE_SOROBAN_SERVER_URL=https://soroban-testnet.stellar.org
VITE_CONTRACT_ID=CA2CPSF57SRXTKGSS2ZBR2FQ2X64O5VMJF6JRFT4PAAN5EDPVYLPX4XN
VITE_NETWORK=testnet
```

- [ ] File exists
- [ ] All three variables present
- [ ] Values are correct
- [ ] No sensitive data committed to git

## Performance Verification

- [ ] Initial load time < 3 seconds
- [ ] Button clicks respond instantly
- [ ] No lag when typing in forms
- [ ] Form validation instant

## Browser Compatibility Verification

Test in multiple browsers if possible:
- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (if on Mac)
- [ ] Edge (if on Windows)

## Mobile Responsiveness Verification

- [ ] Test on mobile width (use DevTools)
- [ ] Layout adapts to narrow screens
- [ ] All buttons clickable on mobile
- [ ] Text readable on small screens
- [ ] No horizontal scroll

## Final Pre-Deployment Verification

- [ ] Production build passes: `npm run build`
- [ ] No errors during build
- [ ] All files in `dist/` look correct
- [ ] Can preview build: `npm run preview`
- [ ] All features work in preview

## Deployment Readiness Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Production build working
- [ ] Environment variables set on platform
- [ ] No console errors in preview
- [ ] Mobile tested
- [ ] Wallet connection tested
- [ ] All documentation reviewed
- [ ] GitHub repo created (if applicable)
- [ ] Ready to share with users!

## Common Issues & Fixes

### Build Fails
```bash
rm -rf node_modules dist
npm install
npm run build
```

### Tests Won't Run
```bash
npm install jsdom --save-dev
npm test
```

### Styling Not Loading
```bash
# Rebuild Tailwind
npm run build
```

### Wallet Won't Connect
1. Install Freighter extension
2. Create/import account
3. Make sure extension is unlocked
4. Refresh page

### Port Already in Use
```bash
npm run dev -- --port 3000
```

## Performance Benchmarks

Target metrics:
- **Build time:** < 60 seconds ✓
- **Gzip bundle:** < 300 KB ✓
- **Load time:** < 3 seconds ✓
- **Time to interactive:** < 2 seconds ✓

## Next Steps After Verification

1. ✅ **All checks passing?** → Deploy!
2. ✅ **Want to customize?** → See FRONTEND_DOCUMENTATION.md
3. ✅ **Need API reference?** → See FILE_REFERENCE.md
4. ✅ **Want to extend?** → See code examples in FILES

## Sign-Off

- [ ] I have verified all checks above
- [ ] Application is ready for development
- [ ] Application is ready for deployment
- [ ] Documentation is complete
- [ ] Team is aware of the setup

**Date Verified:** _______________

**Verified By:** _______________

**Notes/Issues Found:**
_______________________________________________
_______________________________________________
_______________________________________________

---

**🎉 If all checks pass, you're ready to use this dApp!**
