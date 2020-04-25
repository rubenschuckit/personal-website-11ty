---
title: Pulling the Right Strings
date: 2020-04-25T04:58:25.419Z
summary: "Concatenating Strings is tricky business "
tags:
  - post
---
For a whole host of good reasons, Strings in Java (and many other languages) are immutable. Chief among them is security. Strings are often used as arguments to important program components like database usernames and passwords, and if they were mutable, they could easily be changed. Also by having immutable Strings, we are guaranteed that they are thread safe. Still, there are downsides. String concatenation can be an expensive operation.

First, an example. If I am reading lines from a file, concatenating them, and then printing them out to the console I might do something like this:

``` java
String entireFile = "";
while ((line = bufferReader.readLine()) != null) {
    entireFile += line;
}
System.out.println(entireFile);
```