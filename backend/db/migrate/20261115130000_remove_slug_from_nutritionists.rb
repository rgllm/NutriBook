class RemoveSlugFromNutritionists < ActiveRecord::Migration[8.1]
  def up
    remove_index :nutritionists, :slug
    remove_column :nutritionists, :slug
  end

  # The id suffix keeps rebuilt slugs unique when two names match.
  def down
    add_column :nutritionists, :slug, :string

    execute <<~SQL
      UPDATE nutritionists
      SET slug = trim(both '-' from lower(regexp_replace(unaccent(name), '[^a-zA-Z0-9]+', '-', 'g'))) || '-' || id
    SQL

    change_column_null :nutritionists, :slug, false
    add_index :nutritionists, :slug, unique: true
  end
end
