// Pure solver module: explores combinations of numbers and operations to reach target
// Exposes both a global `Solver` for browser and ES module export for tests.

(function(){
  'use strict';

  function uniquePairs(arr){
    var pairs = [];
    for (var i=0;i<arr.length;i++){
      for (var j=i+1;j<arr.length;j++){
        pairs.push([arr[i], arr[j], i, j]);
      }
    }
    return pairs;
  }

  function solveRecursive(nums, target){
    // Base: single number
    if (nums.length === 1){
      var v = nums[0];
      return { diff: Math.abs(v - target), closest: v, steps: [] };
    }

    var best = { diff: Infinity, closest: null, steps: [] };
    var n = nums.length;

    for (var i=0;i<n;i++){
      for (var j=i+1;j<n;j++){
        var a = nums[i], b = nums[j];
        var rest = [];
        for (var k=0;k<n;k++) if (k!==i && k!==j) rest.push(nums[k]);

        var candidates = [];
        candidates.push({op:'+', res:a+b, l:a, r:b});
        candidates.push({op:'-', res:Math.abs(a-b), l:Math.max(a,b), r:Math.min(a,b)});
        candidates.push({op:'×', res:a*b, l:a, r:b});
        var big=Math.max(a,b), small=Math.min(a,b);
        if (small !== 0 && big % small === 0){
          candidates.push({op:'÷', res:big/small, l:big, r:small});
        }

        for (var cIdx=0;cIdx<candidates.length;cIdx++){
          var c = candidates[cIdx];
          var next = rest.slice();
          next.push(c.res);
          var sub = solveRecursive(next, target);
          if (sub.diff < best.diff){
            best.diff = sub.diff;
            best.closest = sub.closest;
            var step = c.l + ' ' + c.op + ' ' + c.r + ' = ' + c.res;
            best.steps = sub.steps.slice();
            best.steps.unshift(step);
            if (best.diff === 0){ return best; }
          }
        }
      }
    }
    return best;
  }

  function solve(numbers, target){
    var nums = numbers.slice().map(function(x){ return parseInt(x,10); }).filter(function(x){ return !isNaN(x); });
    return solveRecursive(nums, target);
  }

  // Browser global
  var api = { solve: solve };
  if (typeof window !== 'undefined'){
    window.Solver = api;
  }
  // ESM/CommonJS support
  if (typeof module !== 'undefined' && module.exports){
    module.exports = api;
  }
})();
