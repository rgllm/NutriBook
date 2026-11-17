Rails.application.routes.draw do
  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  resources :appointment_requests, only: :create
  resources :locations, only: :index do
    get :nearest, on: :collection
  end
  resources :nutritionists, only: :index do
    resources :appointment_requests, only: %i[index update], constraints: { nutritionist_id: /[1-9]\d*/, id: /[1-9]\d*/ }
  end
end
