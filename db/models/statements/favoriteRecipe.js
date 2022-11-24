module.exports.favoriteRecipeStatement = `
  INSERT INTO favorites (recipe_id, user_id)
  VALUES
    (
      $1,
      (
        SELECT
          id
        FROM
          users
        WHERE
          email = $2
      )
    )
`
