<div class="write-preview-container d-flex gap-2 flex-grow-1 overflow-auto">
	<div class="write-container d-flex d-md-flex w-50 position-relative">
		<div component="composer/post-queue/alert" class="m-2 alert alert-info fade pe-none position-absolute top-0 start-0 alert-dismissible">[[modules:composer.post-queue-alert]]<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>
		<div class="draft-icon position-absolute end-0 top-0 mx-2 my-1 hidden-md hidden-lg"></div>
		<textarea class="write shadow-none rounded-1 w-100 form-control" placeholder="[[modules:composer.textarea.placeholder]]">{body}</textarea>
		{{{ if showAnonymousToggle }}}
		<div class="form-check mt-2">
			<label class="form-check-label">
				<input class="form-check-input me-1" type="checkbox" name="anonymous" />
				[[topic:composer.post-anonymously]]
			</label>
		</div>
		{{{ end }}}
	</div>
	<div class="preview-container d-none d-md-flex w-50">
		<div class="preview w-100 overflow-auto"></div>
	</div>
</div>