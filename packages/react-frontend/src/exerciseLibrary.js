import library from './exerciseLibrary.json'

export const TRACKING_FIELDS = {
    sets: { label: 'Sets', unit: 'sets', min: 1, max: 1000, step: 1 },
    reps: { label: 'Reps', unit: 'reps', min: 1, max: 1000, step: 1 },
    weight: { label: 'Load (lb)', unit: 'lb load', min: 0, max: 10000, step: 'any' },
    assistanceWeight: { label: 'Assistance (lb)', unit: 'lb assistance', min: 0, max: 10000, step: 'any' },
    durationSec: { label: 'Time (seconds)', unit: 'sec', min: 1, max: 86400, step: 1 },
    durationMin: { label: 'Time (minutes)', unit: 'min', min: 0.1, max: 1440, step: 'any' },
    distanceKm: { label: 'Distance (km)', unit: 'km', min: 0.01, max: 1000, step: 'any' },
    distanceMeters: { label: 'Distance (m)', unit: 'm', min: 0.1, max: 100000, step: 'any' }
}

export const TRACKING_FORMATS = {
    weight_reps: { label: 'Sets, reps and load', fields: ['sets', 'reps', 'weight'] },
    bodyweight_reps: { label: 'Sets and reps, optional added load', fields: ['sets', 'reps', 'weight'] },
    assistance_reps: { label: 'Sets, reps and assistance', fields: ['sets', 'reps', 'assistanceWeight'] },
    timed_hold: { label: 'Sets and hold time', fields: ['sets', 'durationSec'] },
    time_distance: { label: 'Time and distance', fields: ['durationMin', 'distanceKm'] },
    time: { label: 'Time', fields: ['durationMin'] },
    weight_distance: { label: 'Sets, load and distance', fields: ['sets', 'weight', 'distanceMeters'] }
}

export const EXERCISES = library.map((exercise) => ({

}))

export function trackingFields(exercise) {
    
}

export function exerciseTargets(exercise) {

}
