---
title: Pulling the Right Strings
date: 2020-04-25T04:58:25.419Z
summary: Concatenating Strings is tricky business.
tags:
  - post
---
For a whole host of good reasons, Strings in Java (and many other languages) are immutable. Chief among them is security. Strings are often used as arguments to important program components like database usernames and passwords, and if they were mutable, they could easily be changed. Also by having immutable Strings, we are guaranteed that they are thread safe. Still, there are downsides. String concatenation can be an expensive operation.

First, an example. If I am reading lines from a file, concatenating them, and then printing them out to the console I might do something like this:

```java
String entireFile = "";

while ((line = bufferReader.readLine()) != null) {
    entireFile += line;
}

System.out.println(entireFile);
```

If one were to think there is nothing wrong with this solution, one would have forgotten that Strings are immutable. Each time we want to concatenate a line from the file, we are in reality copying the previous value of `entireFile`, adding on the contents of `line`, and then reassigning `entireFile` to the new String.

So, if the file consisted of:

> *To be, or not to be, that is the question:* 
>
> *Whether 'tis nobler in the mind to suffer*
>
> *The slings and arrows of outrageous fortune*

`entireFile` would initially be empty (from assignment) and then copy over the first line.

*iteration 1*: copy(“”) and append “To be, or not to be, that is the question:\n”

*iteration 2:* copy(“To be, or not to be, that is the question:\n”) and append “Whether ’tis nobler in the mind to suffer\n”

*iteration 3:* copy(“To be, or not to be, that is the question:\n Whether ’tis nobler in the mind to suffer\n”) and append “The slings and arrows of outrageous fortune”)

In order to copy the String, each character is revisited and copied to a new String, which will then be assigned to `entireFile`.

More specifically, if we know the character counts of the lines from lines 1 to 3 (including new line character) are 43, 43, and 44, the following will occur.

**Step 1:** To append the first line of the file we are iterating over the 43 characters from line 1, creating a String with those characters, and assigning it to `entireFile`. **Count from step 1: 43.**

**Step 2:** When we come to line 2, we cannot just append to the end of what `entireFile` holds since the String is immutable and locked in to its initial assignment. Instead, we must create a new String by first copying over the characters already in `entireFile` and then append the characters of the second line and *then*assign the result of this new String to `entireFile`. The number of characters we will have to iterate over is 43 from what `entireFile` holds before appending the second line and then an additional 43 to write the second line to the new String. **Count from step 2: 86.**

**Step 3:** Much the same as step 2, we must first copy over the contents of lines 1 and 2 costing us 86 character iterations and then append the 44 characters of line 3. **Count from step 3: 130.**

When we add up the totals from each step we can see how many characters were iterated over in total to create a String by looping over each line from a file. The total is 43 + 86 + 130 = 259. That’s iterating over 259 characters for a resulting String that has only 130 characters. The difference between the two numbers grows wider as we add more than three lines.

The steps the computer goes through to append to this String is as exhausting as it is to read. In more general terms, assuming the number of lines in the file is *n*, we are looking back at each of the previous lines for each of the *n*lines. Thus, for the first iteration, we are looking back at 1 line, then on the second 2, …, and then on the *n*th *n*. This summation (1 + 2 + 3 + … + *n*) is the familiar triangular sequence whose summation is given by *n(n - 1)/2*which is clearly bounded by *O(n²)*. Assuming the longest line in the file has *m* characters, we can further generalize that normal String concatenation is bounded by *O(mn²)*. Interestingly, concatenation of a String is quadratic in the number of lines and linear in the number of characters in the longest line.