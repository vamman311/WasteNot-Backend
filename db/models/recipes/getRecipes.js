const connectionPool = require('../../utils/connect.js')
const {getRecipesText} = require('../statements/getRecipes.js')


const getRecipes = (req, res, next) => {
  let email = req.query.email || 'guest'
  let ingredients = req.body.ingredients

  let transformedIngredients = ingredients.map(function(string) {
    let transformed = `'%${string}%'`
    return transformed;
  })

  let ingredientsText = `${transformedIngredients}`
  console.log(ingredientsText)
  value = [ingredientsText, email]
  const getRecipes = {
    text: `select
    json_agg(
      json_build_object(
        'recipe_id',
        id,
        'title',
        title,
        'steps',
        directions,
        'ingredients',
        recipes_ingredients,
        'ingredientsNotInPantry',
        (
          select
            json_agg(ingredients_name)
          from
            recipe_ingredients
          where
            recipes_id = recipes.id
            and not exists (
              select
                1
              from
                pantry
              where
                user_id = (select id from users where email = '${email}')
                and recipe_ingredients.ingredients_name like ('%' || pantry_ingredient || '%')
            )
        ),
        'ingredientsInPantry',
        (
          select
            json_agg(ingredients_name)
          from
            recipe_ingredients
          where
            recipes_id = recipes.id
            and exists (
              select
                1
              from
                pantry
              where
                user_id = (select id from users where email = '${email}')
                and recipe_ingredients.ingredients_name like ('%' || pantry_ingredient || '%')
            )
        ),
      'favorited',
      (select exists(select 1 from favorites where (select id from users where email = '${email}') = 1 and favorites.recipe_id = recipes.id))
        )
    )
  from
    recipes
  where
    id in (
      select
        recipes_id
      from
        (
          select
            array_agg(ingredients_name) as match,
            recipes_id
          from
            recipe_ingredients
          where
            ingredients_name like any (array[${ingredientsText}])
          group by
            recipes_id limit 10
        ) as matching
      where
        array_to_string(match, ',') like all (array[${ingredientsText}])
    )`
  }

  connectionPool
  .query(getRecipes)
  .then((data) => {
    res.send(data.rows)
  })
  .catch((err)=>{
    console.log(err)
    res.status(500).end()
  })
}

module.exports = getRecipes