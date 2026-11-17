class AddTrigramSearch < ActiveRecord::Migration[8.1]
  def change
    enable_extension "pg_trgm"

    %i[nutritionists services].each do |table|
      add_column table, :search_name, :virtual, type: :text,
        as: "translate(lower(normalize(name, NFC)), 'áàâãäåéèêëíìîïóòôõöúùûüçñýÿ', 'aaaaaaeeeeiiiiooooouuuucnyy')", stored: true
      add_index table, :search_name, using: :gin, opclass: :gin_trgm_ops
    end
  end
end
