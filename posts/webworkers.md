---
title: Web Workers - A Contrived Example
summary: What are Web Workers and why are they useful?  
date: 2019-12-14
tags:
  - tech
---
## Single Threaded and Concurrent? Hm..
My eyes to how JS works were opened after I watched [this video](https://www.youtube.com/watch?v=8aGhZQkoFbQ) by Philip Roberts about the JS Event Loop. If you haven't watched it, I highly recommend you do (it deservedly has over a million views now). 

When you are first learning JS, one thing you encounter early on is the concept of a callback. When you're first introduced to it, you may not wonder how it works. They're commonly used to help with async flow. From a high-level and perspective it's pretty simple: when something async happens, call this function that is usually passed into another function anonymously. 

Before you can think "hm..what's going on under the hood here" you're distracted by how messy callbacks can be when they depend on other callbacks and the chaos of nesting them. So then you learn about Promises and life moves on. 

Still, you've probably heard at one point or another that JS is a single-threaded concurrent language. How can that be? Aren't those those contradictory? Well, yes and no. 

It's true that JS instructions only have one thread available to them. This means that even though you have callbacks in your code, the contents of the callback function will never be executed at the same time as other code in that file. When that callback will be called is not exactly known (it's async) but it will not be concurrent with other JS code. 

This is a fundamental design of JS. Although JS is doing a lot more than the creators thought it would (and thus necessitated things like web workers), it was designed with the knowledge that the browser was inherently async. UI events, network calls, button clicks, etc.

How does this work? Well--watch the [video](www.youtube.com/watch?v=8aGhZQkoFbQ). But the long and short is whenever there are no more instructions for the JS thread to execute, it will check an event queue to see if there are any functions to execute. This keeps your UI running smoothly. Network calls can be notoriously slow and we wouldn't want the UI to freeze every time one occurred. The browser can handle the request in its own thread and then add to the event queue when it has the results.

### So JS Can't Be Concurrent Then...?
No, it can. Thanks to Web Workers. A Web Worker is a JS file you can truly run concurrently and you can communicate back to the main thread using callbacks (event queue). 

So is this necessary? When I first learned about the event queue I actually wondered to myself are there ever any circumstances where the main thread never has time to check the event queue in the first place? I don't know why I became so focused on this, but I was sort of naive about how much idle time there really was. But I have created a contrived example to do just that by calculating  Fibonacci numbers where we recalculate the same values a bazillion times. 

<div class="glitch-embed-wrap pb-3 col-xs-12 col-lg-6" style="height: 590px">
  <iframe
    src="https://glitch.com/embed/#!/embed/worker-example-fib?path=index.html&previewSize=100&attributionHidden=true"
    title="worker-example-fib on Glitch"
    allow="geolocation; microphone; camera; midi; vr; encrypted-media"
    style="height: 100%; width: 100%; border: 0;">
  </iframe>
</div>

 **Careful, don't  input a number higher than 30-40 at first!**
 The above demo simply calculates the *n*th Fibonacci number recursively by calculating subvalues over and over again. It's an exponential algorithm, and it keeps the main JS thread busy enough to demonstrate what happens when its blocked. 

For example, when I input 40 on my computer, the square stops animating. This is because the main JS thread is also responsible for painting the UI. When it's busy calculating the *n*th Fibonacci number, the event queue grows and nothing is pulled off of it. I animated the square to make this more obvious, but there is another subtle problem. The button that you press stays in the depressed state because it too cannot be repainted as unpressed. 

Now try with the "Use Web Worker" checkbox checked. As you can see, the box keeps animating and the button is able to be repainted. Not to mention, we see a nice "Loading...." paragraph tag to indicate that it's thinking about the solution. This doesn't show up when we don't use Web Workers *even though* if you look at the Glitch code it updates the paragraph tag's inner HTML before the Fibonacci calculation is kicked off. Not a spare moment to repaint! 

Play around with the Glitch and be sure to look a the code to see how the Web Worker is setup. It's fairly simple. Create a new JS file for the Web Worker and then communicate between the threads using events. Hope this is a helpful demo!