# Error Collection App Test Cases

## User Stories and Test Cases

### User Story 1: Adding a New Error
**As a student**, I want to add a new error to my collection so that I can track my mistakes and learn from them.

#### Test Cases:
1. **TC1.1: Adding a new error with required fields only**
   - Precondition: User is on the Add Error page
   - Steps:
     1. Fill in subject field with "Mathematics"
     2. Fill in grade field with "12th Grade"
     3. Fill in semester field with "First Semester"
     4. Set difficulty rating to 3 stars
     5. Enter "Derivative of trigonometric functions" in the question description
     6. Click Save button
   - Expected Result: Error is saved successfully and user is redirected to collection page
   - Status: Not Tested

2. **TC1.2: Adding a new error with all fields**
   - Precondition: User is on the Add Error page
   - Steps:
     1. Fill in all required fields as in TC1.1
     2. Upload a question image
     3. Add error description: "Applied wrong formula for derivative of sin^2(x)"
     4. Add correct solution: "d/dx(sin^2(x)) = 2sin(x)cos(x) = sin(2x)"
     5. Set review date to 2 weeks from today
     6. Add tags: "calculus, derivatives, trigonometry"
     7. Click Save button
   - Expected Result: Error is saved with all details and user is redirected to collection page
   - Status: Not Tested

3. **TC1.3: Validation for missing required fields**
   - Precondition: User is on the Add Error page
   - Steps:
     1. Leave required fields empty (subject, grade, question description)
     2. Click Save button
   - Expected Result: Validation messages appear for the empty required fields
   - Status: Not Tested

4. **TC1.4: Image upload validation**
   - Precondition: User is on the Add Error page
   - Steps:
     1. Try to upload a non-image file (e.g., .pdf or .txt)
     2. Try to upload an image larger than 5MB
   - Expected Result: Error message appears indicating invalid file type or size
   - Status: Not Tested

### User Story 2: Viewing Error Collection
**As a student**, I want to view my collection of errors so that I can see all my tracked mistakes.

#### Test Cases:
1. **TC2.1: Viewing collection with multiple errors**
   - Precondition: User has added at least 3 errors
   - Steps:
     1. Navigate to the Collection page
   - Expected Result: All saved errors are displayed as cards in a grid layout
   - Status: Not Tested

2. **TC2.2: Empty state when no errors exist**
   - Precondition: User has no saved errors
   - Steps:
     1. Navigate to the Collection page
   - Expected Result: Empty state message is displayed with a button to add first error
   - Status: Not Tested

3. **TC2.3: Filtering errors by subject**
   - Precondition: User has errors from different subjects
   - Steps:
     1. Navigate to the Collection page
     2. Click the Filter button
     3. Select "Mathematics" from subject dropdown
     4. Click Apply
   - Expected Result: Only Mathematics errors are displayed
   - Status: Not Tested

4. **TC2.4: Filtering errors by difficulty**
   - Precondition: User has errors with different difficulty levels
   - Steps:
     1. Navigate to the Collection page
     2. Click the Filter button
     3. Select "★★★★" from difficulty dropdown
     4. Click Apply
   - Expected Result: Only 4-star difficulty errors are displayed
   - Status: Not Tested

5. **TC2.5: Filtering errors by tags**
   - Precondition: User has errors with different tags
   - Steps:
     1. Navigate to the Collection page
     2. Click the Filter button
     3. Enter "calculus" in the tags field
     4. Click Apply
   - Expected Result: Only errors tagged with "calculus" are displayed
   - Status: Not Tested

### User Story 3: Viewing Error Details
**As a student**, I want to view the complete details of an error so that I can understand my mistake and the correct solution.

#### Test Cases:
1. **TC3.1: Viewing complete error details**
   - Precondition: User has at least one saved error
   - Steps:
     1. Navigate to the Collection page
     2. Click on an error card
   - Expected Result: Error detail page opens showing all information about the error
   - Status: Not Tested

2. **TC3.2: Navigation between errors**
   - Precondition: User has at least 3 saved errors
   - Steps:
     1. Navigate to the detail page of the second error
     2. Click Next button
     3. Verify third error is displayed
     4. Click Previous button twice
     5. Verify first error is displayed
   - Expected Result: User can navigate between errors using previous and next buttons
   - Status: Not Tested

### User Story 4: Editing an Error
**As a student**, I want to edit an error in my collection so that I can update or correct information.

#### Test Cases:
1. **TC4.1: Editing an existing error**
   - Precondition: User is viewing an error's detail page
   - Steps:
     1. Click Edit button
     2. Change the question description
     3. Update the difficulty level
     4. Add a new tag
     5. Click Save button
   - Expected Result: Error is updated with the new information
   - Status: Not Tested

2. **TC4.2: Canceling an edit**
   - Precondition: User is editing an error
   - Steps:
     1. Make changes to several fields
     2. Click Cancel button
     3. Navigate back to the error detail page
   - Expected Result: No changes are saved and original error details remain
   - Status: Not Tested

### User Story 5: Deleting an Error
**As a student**, I want to delete an error from my collection so that I can remove items I no longer need.

#### Test Cases:
1. **TC5.1: Deleting an error with confirmation**
   - Precondition: User is viewing an error's detail page
   - Steps:
     1. Click Delete button
     2. Confirm deletion in the confirmation dialog
   - Expected Result: Error is deleted and user is redirected to collection page
   - Status: Not Tested

2. **TC5.2: Canceling error deletion**
   - Precondition: User is viewing an error's detail page
   - Steps:
     1. Click Delete button
     2. Cancel deletion in the confirmation dialog
   - Expected Result: Error is not deleted and detail page remains open
   - Status: Not Tested

### User Story 6: Managing Tags
**As a student**, I want to add and remove tags from my errors so that I can better organize and find them later.

#### Test Cases:
1. **TC6.1: Adding multiple tags**
   - Precondition: User is adding or editing an error
   - Steps:
     1. Type "calculus" in the tags field and press Enter
     2. Type "derivatives" in the tags field and press Enter
     3. Type "exam" in the tags field and press Enter
   - Expected Result: All three tags are displayed as chips in the tags area
   - Status: Not Tested

2. **TC6.2: Removing a tag**
   - Precondition: User has added multiple tags to an error
   - Steps:
     1. Click the "x" button on the "exam" tag
   - Expected Result: The "exam" tag is removed while other tags remain
   - Status: Not Tested

3. **TC6.3: Adding duplicate tags**
   - Precondition: User is adding or editing an error
   - Steps:
     1. Add "calculus" tag
     2. Try to add "calculus" tag again
   - Expected Result: No duplicate tag is added
   - Status: Not Tested

### User Story 7: Data Persistence
**As a student**, I want my error collection to be saved between sessions so that I don't lose my data.

#### Test Cases:
1. **TC7.1: Data persistence between browser sessions**
   - Precondition: User has added several errors
   - Steps:
     1. Close the browser
     2. Open the browser again and navigate to the app
   - Expected Result: All previously saved errors are still present
   - Status: Not Tested

2. **TC7.2: Data persistence after page refresh**
   - Precondition: User has modified an error
   - Steps:
     1. After saving changes, refresh the page
   - Expected Result: Changes are preserved after page refresh
   - Status: Not Tested

### User Story 8: Review System
**As a student**, I want to schedule reviews for my errors so that I can practice and reinforce my learning.

#### Test Cases:
1. **TC8.1: Setting review dates**
   - Precondition: User is adding a new error
   - Steps:
     1. Fill in all required fields
     2. Set review date to 1 week from today
     3. Save the error
   - Expected Result: Error is saved with the selected review date
   - Status: Not Tested

2. **TC8.2: Viewing errors by review date**
   - Precondition: User has errors with different review dates
   - Steps:
     1. Navigate to the Collection page
     2. Sort by review date (ascending)
   - Expected Result: Errors are displayed in order of upcoming review dates
   - Status: Not Tested

### User Story 9: Responsive Design
**As a student**, I want to use the application on different devices so that I can access my errors anywhere.

#### Test Cases:
1. **TC9.1: Mobile view for collection page**
   - Precondition: User has several saved errors
   - Steps:
     1. Access the application on a mobile device (or using responsive mode in browser)
     2. Navigate to the Collection page
   - Expected Result: Error cards are displayed in a single column with appropriate sizing
   - Status: Not Tested

2. **TC9.2: Mobile view for add/edit error page**
   - Precondition: User is on a mobile device
   - Steps:
     1. Navigate to the Add Error page
   - Expected Result: Form is properly formatted for mobile view with all fields accessible
   - Status: Not Tested

3. **TC9.3: Tablet view for all pages**
   - Precondition: User is on a tablet device
   - Steps:
     1. Access each page of the application
   - Expected Result: All pages are properly formatted for tablet view
   - Status: Not Tested

### User Story 10: Search Functionality
**As a student**, I want to search through my errors so that I can quickly find specific items.

#### Test Cases:
1. **TC10.1: Searching by keyword**
   - Precondition: User has multiple errors with varied content
   - Steps:
     1. Navigate to the Collection page
     2. Enter "integration" in the search field
   - Expected Result: Only errors containing "integration" in any field are displayed
   - Status: Not Tested

2. **TC10.2: Search with no results**
   - Precondition: User has multiple errors
   - Steps:
     1. Navigate to the Collection page
     2. Enter a keyword that doesn't exist in any error
   - Expected Result: "No results found" message is displayed
   - Status: Not Tested

## Cross-Browser Testing

### Test Case: Cross-Browser Compatibility
1. **TC-CB1: Chrome browser compatibility**
   - Steps: Access all pages on Chrome
   - Expected Result: All functionality works as expected
   - Status: Not Tested

2. **TC-CB2: Firefox browser compatibility**
   - Steps: Access all pages on Firefox
   - Expected Result: All functionality works as expected
   - Status: Not Tested

3. **TC-CB3: Safari browser compatibility**
   - Steps: Access all pages on Safari
   - Expected Result: All functionality works as expected
   - Status: Not Tested

## Performance Testing

### Test Case: Performance
1. **TC-P1: Loading large collections**
   - Precondition: User has 50+ errors saved
   - Steps: Navigate to the Collection page
   - Expected Result: Page loads within 3 seconds with all errors
   - Status: Not Tested

2. **TC-P2: Image loading performance**
   - Precondition: User has errors with images
   - Steps: Navigate through errors with images
   - Expected Result: Images load efficiently without significant delay
   - Status: Not Tested

## Accessibility Testing

### Test Case: Accessibility
1. **TC-A1: Keyboard navigation**
   - Steps: Navigate through the application using only keyboard
   - Expected Result: All functionality is accessible via keyboard
   - Status: Not Tested

2. **TC-A2: Screen reader compatibility**
   - Steps: Use a screen reader to navigate the application
   - Expected Result: All content is properly announced by the screen reader
   - Status: Not Tested

## Test Execution Tracking

| Test Case ID | Description | Execution Date | Status | Notes |
|--------------|-------------|----------------|--------|-------|
| TC1.1 | Adding with required fields | - | Not Tested | - |
| TC1.2 | Adding with all fields | - | Not Tested | - |
| TC1.3 | Required field validation | - | Not Tested | - |
| TC1.4 | Image upload validation | - | Not Tested | - |
| TC2.1 | Viewing multiple errors | - | Not Tested | - |
| TC2.2 | Empty state | - | Not Tested | - |
| TC2.3 | Subject filtering | - | Not Tested | - |
| TC2.4 | Difficulty filtering | - | Not Tested | - |
| TC2.5 | Tag filtering | - | Not Tested | - |
| TC3.1 | Viewing error details | - | Not Tested | - |
| TC3.2 | Error navigation | - | Not Tested | - |
| TC4.1 | Editing an error | - | Not Tested | - |
| TC4.2 | Canceling edit | - | Not Tested | - |
| TC5.1 | Deleting with confirmation | - | Not Tested | - |
| TC5.2 | Canceling deletion | - | Not Tested | - |
| TC6.1 | Adding multiple tags | - | Not Tested | - |
| TC6.2 | Removing tags | - | Not Tested | - |
| TC6.3 | Duplicate tag prevention | - | Not Tested | - |
| TC7.1 | Session persistence | - | Not Tested | - |
| TC7.2 | Refresh persistence | - | Not Tested | - |
| TC8.1 | Setting review dates | - | Not Tested | - |
| TC8.2 | Review date sorting | - | Not Tested | - |
| TC9.1 | Mobile collection view | - | Not Tested | - |
| TC9.2 | Mobile add/edit view | - | Not Tested | - |
| TC9.3 | Tablet view | - | Not Tested | - |
| TC10.1 | Keyword search | - | Not Tested | - |
| TC10.2 | Empty search results | - | Not Tested | - |
| TC-CB1 | Chrome compatibility | - | Not Tested | - |
| TC-CB2 | Firefox compatibility | - | Not Tested | - |
| TC-CB3 | Safari compatibility | - | Not Tested | - |
| TC-P1 | Large collection performance | - | Not Tested | - |
| TC-P2 | Image loading performance | - | Not Tested | - |
| TC-A1 | Keyboard navigation | - | Not Tested | - |
| TC-A2 | Screen reader compatibility | - | Not Tested | - | 