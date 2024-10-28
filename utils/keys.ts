export function getKeyName(...args: string[]) {
    return `bites:${args.join(":")}`
}

export const restaurantKeyById = (id: string) => getKeyName('restaurants', id)
export const reviewKeyById = (id: string) => getKeyName('reviews', id)
export const reviewDetailKeyById = (id: string) => getKeyName('review_details', id)
export const cuisinesKey = getKeyName('cuisines')
export const cuisineKey = (name: string) => getKeyName('cuisine', name) 
export const restaurantCuisineKeyById = (id: string) => getKeyName('restaurant_cuisines', id)
export const restaurantsByRatingKey = getKeyName("restaurants_by_rating");
export const weatherKeyById = (id: string) => getKeyName('weather', id)
export const restaurantDetailsKeyById = (id: string) => getKeyName('restaurant_details', id)