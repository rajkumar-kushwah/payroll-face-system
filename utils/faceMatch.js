function euclideanDistance(d1, d2) {
  let sum = 0;
  for (let i = 0; i < d1.length; i++) {
    sum += Math.pow(d1[i] - d2[i], 2);
  }
  return Math.sqrt(sum);
}

export function verifyEmployeeFace(employees, liveDescriptors) {
  let bestEmployee = null;
  let bestDistance = Infinity;
  let validFrames = 0;

  for (const emp of employees) {
    let matchFrames = 0;

    for (const live of liveDescriptors) {
      const dist = euclideanDistance(live, emp.faceDescriptor);
      if (dist < 0.55) {
        matchFrames++;
        if (dist < bestDistance) {
          bestDistance = dist;
          bestEmployee = emp;
        }
      }
    }

    if (matchFrames >= 2) {
      validFrames = matchFrames;
      break;
    }
  }

  if (!bestEmployee) return null;

  return {
    employee: bestEmployee,
    confidence: Number((1 - bestDistance).toFixed(2))
  };
}
