type CounterMap = Record<string, number>;

const counters: CounterMap = {
    requests_total: 0,
    requests_error_total: 0,
    ai_jobs_total: 0,
    ai_jobs_failed_total: 0,
    cache_hits_total: 0,
    cache_misses_total: 0,
};

const latencies: number[] = [];

export function recordMetric(name: keyof typeof counters, value = 1): void {
    counters[name] = (counters[name] || 0) + value;
}

export function recordLatency(ms: number): void {
    latencies.push(ms);
    if (latencies.length > 200) {
        latencies.shift();
    }
}

export function getMetrics() {
    const averageLatency = latencies.length
        ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length)
        : 0;

    return {
        ...counters,
        latency_ms: {
            average: averageLatency,
            samples: latencies.length,
        },
    };
}