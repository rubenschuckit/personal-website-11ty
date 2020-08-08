---
title: Pulling the Right Strings
date: 2020-04-25T04:58:25.419Z
summary: Concatenating Strings is tricky business.
tags:
  - post
---
For a whole host of good reasons, Strings in Java (and many other languages) are immutable. Strings are often used as arguments to important program components like database usernames and passwords, and they're designed to be difficult to change without reassignment. Also by having immutable Strings, they are guaranteed to be thread safe. Despite these practical reasons, my favorite reason comes from some wisdom I read on [Stack Overflow](https://stackoverflow.com/questions/22397861/why-is-string-immutable-in-java#comment34052636_22397861): "*Why* is always difficult to answer. The most correct answer is probably: Because the language designers figured it was a good idea." Truer words. Still, there are downsides. String concatenation can become an expensive operation.

First, an example. If I am reading lines from a file, concatenating them, and then printing them out to the console I might do something like this:

```java
String entireFile = "";
String line;
while ((line = bufferReader.readLine()) != null) {
    entireFile += line;
}

System.out.println(entireFile);
```

If one were to think there is nothing wrong with this solution, one would have forgotten that Strings are immutable. Each time we want to concatenate a line from the file, we are in reality copying the previous value of `entireFile`, adding on the contents of `line`, and then reassigning the result to `entireFile`.

# An Example

So, if the file consisted of:

```
To be, or not to be, that is the question: 
Whether 'tis nobler in the mind to suffer
The slings and arrows of outrageous fortune
```

The concatenation would look something like...

**Iteration 1**: Create a new String with contents `To be, or not to be, that is the question:\n`

**Iteration 2**: Copy `To be, or not to be, that is the question:\n` and append `Whether ’tis nobler in the mind to suffer\n`

**Iteration 3**: Copy `To be, or not to be, that is the question:\n Whether ’tis nobler in the mind to suffer\n` and append `The slings and arrows of outrageous fortune`

In order to append to the String, each character is revisited and copied to a new String, which will then be assigned to `entireFile`.

Numerically speaking, since we know the character counts of the lines from lines 1 to 3 (including new line character) are 43, 43, and 44, the following character iterations will occur: 

**Step 1:** To append the first line of the file we are iterating over the 43 characters from line 1, creating a String with those characters, and assigning it to `entireFile`. **Count from step 1: 43.**

**Step 2:** When we come to line 2, we cannot just append to the end of what `entireFile` holds since the String is immutable and locked into its initial assignment. Instead, we must create a new String by first copying over the characters already in `entireFile` and then append the characters of the second line. Then it's time to assign the result of this new String to `entireFile`. The number of characters we will have to iterate over is 43 from what `entireFile` holds before appending the second line and then an additional 43 characters to copy over the second line. **Count from step 2: 86.**

**Step 3:** Much the same as step 2, we must first copy over the contents of lines 1 and 2 costing us 86 character iterations and then append the 44 characters from line 3. **Count from step 3: 130.**

The total number of characters looped over is 43 + 86 + 130 = 259. That’s iterating over 259 characters for a resulting String that has only 130 characters. The difference between the two numbers grows wider as we add more than three lines.

# Putting it All Together

The steps the computer goes through to append to this String is as exhausting as it is to read. In more general terms, assuming the number of lines in the file is *n*, we are looking back at each of the previous lines for each of the *n* lines. Thus, for the second iteration, we are looking back at 1 line, then on the 3rd we look back at 2 lines, and then on the *n*th line we look back at *n-1* lines. This summation (1 + 2 + 3 + … + *n*) is the familiar triangular sequence whose summation is given by *n(n - 1)/2* which is clearly bounded by *O(n²)*. Assuming the longest line in the file has *m* characters, we can further generalize that normal String concatenation is bounded by *O(mn²)*. Interestingly, concatenation of a String is quadratic in the number of lines and linear in the number of characters in the longest line.

# Where to Go from Here?

So…is there a better way? You may be wondering why we can’t just have a one-to-one correspondence of the characters we iterate over to the number of characters in a String. From above we clearly see there is a lot of extra and unnecessary work being done. Luckily there is a better way, and in Java it’s in the form of StringBuilder and StringBuffer. The only difference between the two is that StringBuffer is thread safe by synchronizing all of its methods, but the APIs for both are virtually identical.

From a high level, what we want to accomplish is to have a buffer that is larger than the number of characters it holds so that there is room for new characters to be appended after the existing contents.

After examining the [source code](http://developer.classpath.org/doc/java/lang/StringBuilder-source.html) for StringBuilder, we can see it accomplishes this by having a `char` array `char[] value` and a `count` that tracks how many chars are in `value`, but not the capacity of value. The default length of `value` is 16, but can be specified differently as an argument to the StringBuilder constructor.

Let’s walk through what would happen with StringBuilder with the same example above.

First, we’d create our StringBuilder and give a best guess for how long our final String is going to be. This decision is a trade off. On one hand, if we pick an initial capacity too large we will be wasting memory. Although not all is lost, as when we are done with StringBuilder we call `toString()` on it to obtain a String (we don’t just want the buffer) and the buffer will be garbage collected. Still, we must provision each byte to create the array so make it too big and it becomes a (probably small) performance trade off. On the other hand, guess too low and we’ll suffer from resizing pains. The StringBuilder resizes itself much in the same way as an `ArrayList`. Before adding to the buffer, the object calls `ensureCapacity(int capacity)` to make sure there is room in the buffer for the new addition. If it isn’t, the buffer is grown to its current length * 2 + 2 or the new length of the resulting String — whichever is bigger.

Okay, back to the example. Let’s do this the smart way and create a StringBuilder. Let’s assume the program (in an oddly specific scenario) is going to read three lines of a random Shakespeare play. I think this will take around 70 characters (although the true value is ~150). The code would look something like this

```java
StringBuilder builder = new StringBuilder(70);
String line;
while ((line = bufferReader.readLine()) != null) {
    // the old way entireFile += line;
    builder.append(line);
}

return builder.toString();
```

It looks *very* similar, but behind the scenes it is far more efficient.