export const fromEndPoints = (start, end) => [end.x - start.x, end.y - start.y];

export const scale = (k) => ([x, y]) => [k * x, k * y];

export const length = ([x, y]) => Math.sqrt(x * x + y * y);

export const normalize = (vec) => scale(1 / length(vec))(vec);
