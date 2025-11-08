# FUNCTIONAL BUG ANALYSIS REPORT

## Summary
- Files analyzed: 18
- Bugs found: 6
- High: 2, Medium: 3, Low: 1

## VERIFIED BUGS

### BUG-FUNC-001: Inconsistent ETA Calculation in ProgressBar.getRenderString()
**Severity:** MEDIUM
**File:** /home/user/termstyle/src/effects/progress.ts:268
**Category:** Logic Error / API Contract Violation

**Buggy Code:**
```typescript
// Line 268 in getRenderString()
const eta = percent > 0 ? (elapsed / percent - elapsed) : 0;
```

**Expected Behavior:**
Should use the same threshold and capping logic as the `render()` method to prevent extremely large ETA values.

**Actual Behavior:**
- Uses `percent > 0` instead of `percent > 0.001` like in `render()` at line 175
- Does NOT cap ETA at 86400 seconds (24 hours) like `render()` does at line 176
- For very small progress (e.g., 0.0001%), can produce ETA of 100,000+ seconds

**Reproduction:**
```typescript
import { ProgressBar } from './effects/progress';

// Create progress bar
const bar = new ProgressBar({ total: 10000 });
bar.update(1); // 0.01% progress after 10 seconds

// Get render string - will have huge uncapped ETA
const str = bar.getRenderString();
// ETA will be ~999990 seconds instead of capped 86400
```

**Root Cause:**
The `getRenderString()` method was not updated when the ETA calculation fix was applied to `render()` at lines 175-176.

**Fix Strategy:**
Apply the same logic from `render()` to `getRenderString()`:
```typescript
const rawEta = percent > 0.001 ? (elapsed / percent - elapsed) : 0;
const eta = Math.min(rawEta, 86400); // Cap at 24 hours
```

---

### BUG-FUNC-002: Incorrect Grayscale Conversion Formula
**Severity:** HIGH
**File:** /home/user/termstyle/src/core/color-processor.ts:356
**Category:** Logic Error / Incorrect Algorithm

**Buggy Code:**
```typescript
// Line 356
return Math.round(((r - 8) / 247) * 23) + 232;
```

**Expected Behavior:**
Should correctly map RGB grayscale values (8-238) to ANSI 256 colors (232-255).
- rgb(8,8,8) → color 232
- rgb(238,238,238) → color 255

**Actual Behavior:**
Uses incorrect denominator 247 (which is 255-8) instead of 230 (which is 238-8):
- rgb(8,8,8) → color 232 ✓
- rgb(238,238,238) → color 253 ✗ (should be 255)
- rgb(128,128,128) → color 243 ✗ (should be 244)

**Reproduction:**
```typescript
import { ColorProcessor } from './core/color-processor';

// Test grayscale conversion
const color1 = ColorProcessor.rgbTo256(238, 238, 238);
console.log(color1); // Returns 253, should be 255

const color2 = ColorProcessor.rgbTo256(128, 128, 128);
console.log(color2); // Returns 243, should be 244

// Compare with correct implementation in ansi.ts
import { rgbToAnsi256 } from './core/ansi';
const correct = rgbToAnsi256(238, 238, 238);
console.log(correct); // Returns 255 (correct)
```

**Root Cause:**
The formula uses `247` as the denominator, which assumes the grayscale range is 8-255. However, the ANSI 256 grayscale ramp only goes up to rgb(238,238,238) at color 255, not rgb(255,255,255). The denominator should be `230` (238-8) to correctly map the range.

**Fix Strategy:**
```typescript
// Change line 356 from:
return Math.round(((r - 8) / 247) * 23) + 232;

// To:
return Math.round(((r - 8) / 230) * 23) + 232;
```

---

### BUG-FUNC-003: Inconsistent Bright White Threshold
**Severity:** LOW
**File:** /home/user/termstyle/src/core/color-processor.ts:354 vs /home/user/termstyle/src/core/ansi.ts:106
**Category:** API Contract Violation / Inconsistency

**Buggy Code:**
```typescript
// src/core/color-processor.ts:354
if (r > 248) return 231;

// src/core/ansi.ts:106
if (r > 238) return 231;
```

**Expected Behavior:**
Both functions should use the same threshold for determining when to use the white color from the 6x6x6 cube (231) instead of the grayscale ramp.

**Actual Behavior:**
- `color-processor.ts` uses threshold `> 248`
- `ansi.ts` uses threshold `> 238`
- This causes inconsistent behavior depending on which function is called

**Reproduction:**
```typescript
import { ColorProcessor } from './core/color-processor';
import { rgbToAnsi256 } from './core/ansi';

// Test with rgb(245, 245, 245)
const result1 = ColorProcessor.rgbTo256(245, 245, 245);
const result2 = rgbToAnsi256(245, 245, 245);

console.log(result1); // Returns 254 (from grayscale, uses > 248)
console.log(result2); // Returns 231 (white from cube, uses > 238)
// Different results for same input!
```

**Root Cause:**
The two implementations were written independently and use different logic for the edge case of very bright grayscale colors.

**Fix Strategy:**
Standardize on one threshold. The `> 238` threshold in `ansi.ts` is more correct since 238 is the maximum value in the grayscale ramp.

```typescript
// Change color-processor.ts line 354 to:
if (r > 238) return 231;
```

---

### BUG-FUNC-004: Incorrect Reset Code Index Calculation
**Severity:** HIGH
**File:** /home/user/termstyle/src/styles/style.ts:77, 107
**Category:** Logic Error / Data Structure Issue

**Buggy Code:**
```typescript
// Lines 72-82
for (let i = indicesToRemove.length - 1; i >= 0; i--) {
  const index = indicesToRemove[i];
  if (index >= 0 && index < newCodes.length) {
    newCodes.splice(index, 1);
    // BUG: Using loop variable 'i' instead of code index
    const resetIndex = Math.min(newResetCodes.length - 1, Math.max(0, newResetCodes.length - 1 - i));
    if (resetIndex >= 0 && resetIndex < newResetCodes.length) {
      newResetCodes.splice(resetIndex, 1);
    }
  }
}
```

**Expected Behavior:**
When removing color codes, the corresponding reset codes should be removed based on the actual code index, not the loop iteration variable.

**Actual Behavior:**
The reset index is calculated using `i` (the loop variable iterating over `indicesToRemove`), not `index` (the actual position in the codes array). This causes the wrong reset codes to be removed.

**Reproduction:**
```typescript
import { Style } from './styles/style';

// Create a style with multiple colors
let style = new Style([], [], {});
style = style.red;      // Add red (code at index 0, reset at index 0)
style = style.blue;     // Add blue (code at index 1, reset at index 0)
style = style.green;    // Add green (code at index 2, reset at index 0)

// Now replace with yellow - should remove all previous foreground colors
style = style.yellow;

// Internal state will have wrong reset codes removed
// indicesToRemove = [2, 1, 0] (in reverse)
// Loop: i=2, index=2 → removes reset at position length-1-2 (wrong!)
// Should remove reset corresponding to code index 2, not loop index 2
```

**Root Cause:**
The reset codes array is stored in reverse order (prepended on each add). When removing codes, the formula `newResetCodes.length - 1 - i` uses the loop variable `i` instead of calculating the correct position based on the code index. Additionally, splicing changes the array length during iteration, making the calculation increasingly incorrect.

**Fix Strategy:**
Calculate reset indices before any splicing, or use a mapping between code indices and reset indices:

```typescript
// Collect indices first
const resetIndicesToRemove = indicesToRemove.map(codeIndex =>
  newResetCodes.length - 1 - codeIndex
);

// Remove codes in reverse order
for (let i = indicesToRemove.length - 1; i >= 0; i--) {
  const codeIndex = indicesToRemove[i];
  const resetIndex = resetIndicesToRemove[i];

  if (codeIndex >= 0 && codeIndex < newCodes.length) {
    newCodes.splice(codeIndex, 1);
  }
  if (resetIndex >= 0 && resetIndex < newResetCodes.length) {
    newResetCodes.splice(resetIndex, 1);
  }
}
```

---

### BUG-FUNC-005: Missing Validation for Invalid Log Level
**Severity:** MEDIUM
**File:** /home/user/termstyle/src/conditional.ts:185
**Category:** Edge Case / API Contract Violation

**Buggy Code:**
```typescript
// Line 185 in LogFormatter constructor
this.minLevel = logLevels[options.minLevel || 'info'].value;
```

**Expected Behavior:**
Should validate that `options.minLevel` is a valid log level name, or throw a helpful error message.

**Actual Behavior:**
If an invalid log level name is provided, the code attempts to access `.value` on `undefined`, causing a TypeError with an unhelpful message.

**Reproduction:**
```typescript
import { createLogFormatter } from './conditional';

// Pass invalid log level
try {
  const formatter = createLogFormatter({ minLevel: 'invalid' });
  // TypeError: Cannot read property 'value' of undefined
} catch (error) {
  console.error(error);
  // Unhelpful error message
}
```

**Root Cause:**
No validation that `options.minLevel` exists as a key in the `logLevels` object before accessing its properties.

**Fix Strategy:**
Add validation with a helpful error message:

```typescript
constructor(options: { minLevel?: string; usePrefix?: boolean; timestamp?: boolean } = {}) {
  const levelName = options.minLevel || 'info';

  if (!(levelName in logLevels)) {
    const validLevels = Object.keys(logLevels).join(', ');
    throw new Error(
      `Invalid log level '${levelName}'. Valid levels: ${validLevels}`
    );
  }

  this.minLevel = logLevels[levelName].value;
  this.usePrefix = options.usePrefix ?? true;
  this.timestamp = options.timestamp ?? false;
}
```

---

### BUG-FUNC-006: Missing Validation for Count Parameter
**Severity:** MEDIUM
**File:** /home/user/termstyle/src/core/hsl-support.ts:199
**Category:** Edge Case / Input Validation

**Buggy Code:**
```typescript
// Lines 191-199 in monochromatic()
static monochromatic(hsl: HSLColor, count: number = 5): HSLColor[] {
  const colors: HSLColor[] = [];

  // Fix: Handle edge case when count is 1 to prevent division by zero
  if (count === 1) {
    return [{ ...hsl }];
  }

  const step = 100 / (count - 1);
  // ... rest of function
```

**Expected Behavior:**
Should validate that `count` is a positive integer greater than 0, or handle edge cases gracefully.

**Actual Behavior:**
- `count = 1`: Handled correctly (returns single color)
- `count = 0`: Division by zero: `100 / (0 - 1) = 100 / -1 = -100`, produces invalid colors
- `count < 0`: Produces negative step size, results in invalid colors or infinite loops

**Reproduction:**
```typescript
import { HSLProcessor } from './core/hsl-support';

const baseColor = { h: 180, s: 50, l: 50 };

// Test with count = 0
const colors0 = HSLProcessor.monochromatic(baseColor, 0);
// Returns array with colors at negative lightness values

// Test with count = -5
const colorsNeg = HSLProcessor.monochromatic(baseColor, -5);
// Produces invalid results
```

**Root Cause:**
Only handles the `count === 1` edge case but doesn't validate for `count <= 0`.

**Fix Strategy:**
Add validation at the start of the function:

```typescript
static monochromatic(hsl: HSLColor, count: number = 5): HSLColor[] {
  // Validate count
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error(`Count must be a positive integer, got ${count}`);
  }

  const colors: HSLColor[] = [];

  // Handle edge case when count is 1
  if (count === 1) {
    return [{ ...hsl }];
  }

  const step = 100 / (count - 1);
  // ... rest of function
```

---

## Additional Findings

### Non-Critical Observations:

1. **Animation Edge Case** (src/effects/animation.ts:110-120): When `totalFrames = 1`, the animation only renders at progress 0.0 and never reaches 1.0. This might be intentional for very short animations, but could be unexpected behavior.

2. **Box Title Width** (src/effects/box.ts:157): When a user specifies `width` but the title is longer, the function ignores the user's width specification to accommodate the title. This is documented behavior but might surprise users.

3. **Template Parsing** (src/template.ts:15): Has a MAX_ITERATIONS limit of 100 to prevent infinite loops, which is good defensive programming.

## Testing Recommendations

For each bug, create unit tests that:
1. Test the specific edge case
2. Verify the fix doesn't break existing functionality
3. Test boundary conditions
4. Test with various input types (null, undefined, extreme values)

## Impact Assessment

**High Priority (Must Fix):**
- BUG-FUNC-002: Causes incorrect color rendering
- BUG-FUNC-004: Breaks style chaining with multiple colors

**Medium Priority (Should Fix):**
- BUG-FUNC-001: Can cause UI confusion with huge ETA values
- BUG-FUNC-005: Poor developer experience with unclear errors
- BUG-FUNC-006: Can produce invalid output or errors

**Low Priority (Nice to Have):**
- BUG-FUNC-003: Inconsistency but rare edge case

## Conclusion

This analysis found 6 verified functional bugs in the TermStyle codebase, primarily in the areas of:
- Color conversion algorithms (2 bugs)
- Progress bar calculations (1 bug)
- Style code management (1 bug)
- Input validation (2 bugs)

All bugs have been documented with reproduction steps and fix strategies.
