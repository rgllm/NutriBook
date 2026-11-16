# A walkthrough of the pending-requests pages, built from the current database.
#
# Seeding again after records are deleted moves the IDs, because PostgreSQL
# does not reset its sequences, so the README cannot name fixed URLs. This
# prints them, with what each page should show. Run it with `pnpm demo`.
class DemoGuide
  def initialize(base_url: ENV.fetch("FRONTEND_URL", "http://localhost:3000"))
    @base_url = base_url
  end

  def to_s
    [ *busiest_lines, empty_line, missing_line, malformed_line ].compact.join("\n")
  end

  private

  def busiest_lines
    nutritionist_id = AppointmentRequest.pending.group(:nutritionist_id).order(count_all: :desc, nutritionist_id: :asc).count.keys.first
    return [ "- No pending requests. Rebuild the demo data to get some (see the README)." ] unless nutritionist_id

    nutritionist = Nutritionist.find(nutritionist_id)
    requests = nutritionist.appointment_requests.pending.order(:starts_at, :id).to_a

    [
      "- **#{nutritionist.name}, with #{count(requests.size, "pending request")}:** #{requests_url(nutritionist.id)}",
      *overlap_lines(requests).map { |line| "  - #{line}" }
    ]
  end

  def overlap_lines(requests)
    overlaps = requests.index_with do |request|
      requests.select { |other| other != request && other.starts_at < request.ends_at && other.ends_at > request.starts_at }
    end
    explained = Set.new

    lines = overlaps.filter_map do |request, others|
      next if others.empty? || explained.include?(request)

      explained.merge([ request, *others ])
      cards = others.one? ? "Both cards leave" : "All #{others.size + 1} cards leave"
      toast = others.one? ? "1 overlapping request was rejected." : "#{others.size} overlapping requests were rejected."
      "Accepting #{request.guest_name} also rejects #{possessive_names(others)} #{others.one? ? "request, which overlaps" : "requests, which overlap"} it. " \
        "#{cards} and the toast reads \"#{toast}\""
    end

    free = overlaps.select { |_, others| others.empty? }.keys.map(&:guest_name)
    lines << free_line(free) if free.any?
    lines
  end

  def free_line(names)
    if names.one?
      "#{names.first} doesn't overlap anyone, so accepting or rejecting it removes only that card."
    else
      either = names.size == 2 ? "either one" : "any of them"
      "#{names.to_sentence} don't overlap anyone, so accepting or rejecting #{either} removes only that card."
    end
  end

  def empty_line
    nutritionist = Nutritionist.where.not(id: AppointmentRequest.pending.select(:nutritionist_id)).order(:id).first
    "- **#{nutritionist.name}, with no requests:** #{requests_url(nutritionist.id)} shows the empty state." if nutritionist
  end

  def missing_line
    id = [ 999_999, Nutritionist.maximum(:id).to_i + 1 ].max
    "- **An ID with no nutritionist:** #{requests_url(id)} shows the 404 page."
  end

  def malformed_line
    "- **A malformed ID:** #{requests_url("1abc")} returns a real 404."
  end

  def possessive_names(requests)
    requests.map { |request| "#{request.guest_name}'s" }.to_sentence
  end

  def count(number, noun)
    "#{number} #{noun.pluralize(number)}"
  end

  def requests_url(id)
    "#{@base_url}/nutritionists/#{id}/requests"
  end
end
