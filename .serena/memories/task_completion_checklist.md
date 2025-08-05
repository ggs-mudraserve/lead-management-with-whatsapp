# Task Completion Checklist

## Before Completing Any Task
1. **Lint the code**: Run `npm run lint` to check for code quality issues
2. **Build the project**: Run `npm run build` to ensure no build errors
3. **Test locally**: Run `npm run dev` and test the functionality
4. **Check TypeScript**: Ensure no TypeScript errors in the IDE

## Code Quality Standards
- Follow existing code patterns and conventions
- Use proper TypeScript typing
- Implement proper error handling
- Follow Material-UI theming patterns
- Ensure responsive design

## Database Changes
- Test RLS policies if database changes are made
- Verify data access patterns work correctly
- Check that real-time subscriptions still function

## Security Checklist
- Verify authentication/authorization still works
- Check that sensitive data is properly protected
- Ensure no secrets are exposed in client code

## Final Verification
- Test the complete user workflow
- Verify no console errors in browser
- Check that all existing functionality still works
- Test with different user roles if applicable