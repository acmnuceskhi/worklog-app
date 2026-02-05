# ✅ Testing Checklist - Worklog Application

## 🔐 Login Page Tests
- [ ] Page loads at http://localhost:3000/login
- [ ] Email input accepts text
- [ ] Password input masks text
- [ ] Error shows when fields empty
- [ ] Error shows when email invalid
- [ ] Login button navigates to /home
- [ ] Enter key submits form
- [ ] GitHub login button shows alert
- [ ] Google login button shows alert
- [ ] Sign Up link shows alert
- [ ] Animations play smoothly
- [ ] Video loads (if 298875.mp4 exists in /public)

## 🏠 Home Dashboard Tests
- [ ] Page loads at /home after login
- [ ] "Create Teams" button works
- [ ] "Lead Teams" button navigates to /teams/lead
- [ ] "Member Teams" button navigates to /teams/member
- [ ] "Help" button opens modal
- [ ] Help modal closes with button
- [ ] "Report Bug" button shows alert
- [ ] "Logout" button redirects to /login
- [ ] Accept invitation removes it and shows alert
- [ ] Decline invitation removes it and shows alert
- [ ] Team name input works
- [ ] Team description input works
- [ ] Add email input works
- [ ] Add button creates chips
- [ ] Remove chip (×) works
- [ ] Create Team button submits form

## 👥 Lead Teams Tests
- [ ] Page loads at /teams/lead
- [ ] All team bubbles display
- [ ] Clicking team navigates to /teams/lead/[id]
- [ ] Navbar shows "Home" button
- [ ] "Home" button works
- [ ] "Logout" button works
- [ ] Hover effects work on bubbles

## 📊 Team Details (Lead) Tests
- [ ] Page loads with team name and leader
- [ ] All members display in table
- [ ] Star ratings are clickable
- [ ] Ratings update on click
- [ ] Rankings panel sorts correctly
- [ ] "Back" button goes to /teams/lead
- [ ] "Home" button goes to /home
- [ ] "Logout" button goes to /login
- [ ] Ratings persist while on page

## 👨‍💼 Member Teams Tests
- [ ] Page loads at /teams/member
- [ ] Accepted teams display
- [ ] Clicking team navigates to /teams/member/[id]
- [ ] Hover effects work
- [ ] Navbar links functional

## 📝 Contribution Flashcard Tests
- [ ] Page loads with team name
- [ ] Textarea accepts input
- [ ] Submit button submits contribution
- [ ] Confirmation alert appears
- [ ] Textarea clears after submission
- [ ] Contributions display in history
- [ ] Timestamps show correctly
- [ ] Multiple submissions work
- [ ] "Back" button works
- [ ] "Home" button works
- [ ] "Logout" button works

## 🌐 Navigation Tests
- [ ] All pages have consistent navbar
- [ ] Home link works from all pages
- [ ] Logout works from all pages
- [ ] Back button works (where applicable)
- [ ] No broken links
- [ ] Browser back button works

## 📱 Responsive Design Tests
- [ ] Desktop view (1920px)
- [ ] Tablet view (768px)
- [ ] Mobile view (375px)
- [ ] No overflow issues
- [ ] Text readable on all sizes

## 🎨 Visual/UX Tests
- [ ] Colors consistent throughout
- [ ] Fonts load correctly
- [ ] Icons display properly
- [ ] Buttons have hover effects
- [ ] Forms have proper spacing
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Animations smooth
- [ ] Loading states work

## 🔧 Performance Tests
- [ ] Page load time < 3s
- [ ] No memory leaks
- [ ] No unused console logs
- [ ] Images/videos optimized

---

**Test Date**: _______
**Tester**: _______
**Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete

**Issues Found**:
- _______________________
- _______________________
- _______________________

**Notes**:
_________________________________________________________________________
