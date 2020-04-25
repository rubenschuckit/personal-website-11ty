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