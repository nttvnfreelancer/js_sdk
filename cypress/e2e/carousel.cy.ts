describe('Carousel spec', () => {
  const SLIDE_NUM = 4;

  context('with default navigation and pagination', () => {
    it('should show carousel ad with default navigation and pagination', () => {
      const selector = 'div#carousel';
      cy.visit('http://bs-local.com:3111/carousel.html');
      cy.wait(1000);

      // verify the visibility of the root element of carousel
      cy.get(selector).find('.runa-carousel').should('be.visible');
      // verify the number of slides
      cy.get(selector)
        .find('.runa-carousel')
        .find('[id^=adspot-]')
        .should('have.length', SLIDE_NUM);
      // verify the visibility of the navigation
      cy.get(selector)
        .find('.runa-carousel__navigation-next')
        .should('be.visible');
      cy.get(selector)
        .find('.runa-carousel__navigation-prev')
        .should('not.be.visible');
      // verify the visibility of the pagination
      cy.get(selector).find('.runa-carousel__pagination').should('be.visible');
      // verify the number of pagination bullets
      cy.get(selector)
        .find('.runa-carousel__pagination')
        .find('.runa-carousel__pagination-bullet')
        .should('have.length', SLIDE_NUM);
      // verify the first slide is visible
      cy.get(selector)
        .find('.runa-carousel')
        .find('[id^=adspot-]')
        .first()
        .should('be.visible');
      // verify the first bullet is active
      cy.get(selector)
        .find('.runa-carousel__pagination')
        .find('.runa-carousel__pagination-bullet')
        .first()
        .should('have.class', 'runa-carousel__pagination-bullet_active');
    });

    it('should move next slide when next arrow is clicked', () => {
      const selector = 'div#carousel';
      cy.visit('http://bs-local.com:3111/carousel.html');
      cy.wait(1000);

      // click the next button
      cy.get(selector).find('.runa-carousel__navigation-next').click();
      // verify the secound slide is visible
      cy.get(selector)
        .find('.runa-carousel')
        .find('[id^=adspot-]')
        .eq(1)
        .should('be.visible');
      // verify the second bullet is active
      cy.get(selector)
        .find('.runa-carousel__pagination')
        .find('.runa-carousel__pagination-bullet')
        .eq(1)
        .should('have.class', 'runa-carousel__pagination-bullet_active');
    });

    it('should move previous slide when prev arrow is clicked', () => {
      const selector = 'div#carousel';
      cy.visit('http://bs-local.com:3111/carousel.html');
      cy.wait(1000);

      // click the next button
      cy.get(selector).find('.runa-carousel__navigation-next').click();
      cy.wait(500);
      // click the next button
      cy.get(selector).find('.runa-carousel__navigation-prev').click();
      // verify the secound slide is visible
      cy.get(selector)
        .find('.runa-carousel')
        .find('[id^=adspot-]')
        .eq(1)
        .should('be.visible');
      // verify the second bullet is active
      cy.get(selector)
        .find('.runa-carousel__pagination')
        .find('.runa-carousel__pagination-bullet')
        .first()
        .should('have.class', 'runa-carousel__pagination-bullet_active');
    });

    it('should correctly show last slide', () => {
      const selector = 'div#carousel';
      cy.visit('http://bs-local.com:3111/carousel.html');
      cy.wait(1000);

      // click the next button
      Cypress._.times(SLIDE_NUM - 1, () => {
        cy.get(selector).find('.runa-carousel__navigation-next').click();
        cy.wait(500);
      });
      // verify the last slide is visible
      cy.get(selector)
        .find('.runa-carousel')
        .find('[id^=adspot-]')
        .eq(SLIDE_NUM - 1)
        .should('be.visible');
      // verify the last bullet is active
      cy.get(selector)
        .find('.runa-carousel__pagination')
        .find('.runa-carousel__pagination-bullet')
        .eq(SLIDE_NUM - 1)
        .should('have.class', 'runa-carousel__pagination-bullet_active');
      // verify the visibility of the navigation
      cy.get(selector)
        .find('.runa-carousel__navigation-next')
        .should('be.not.visible');
      cy.get(selector)
        .find('.runa-carousel__navigation-prev')
        .should('be.visible');
    });
  });

  context('with loop mode', () => {
    it('should show carousel ad with default navigation and pagination', () => {
      const selector = 'div#carousel-loop';
      cy.visit('http://bs-local.com:3111/carousel.html');
      cy.wait(1000);

      // verify the visibility of the root element of carousel
      cy.get(selector).find('.runa-carousel').should('be.visible');
      // verify the number of slides
      cy.get(selector)
        .find('.runa-carousel')
        .find('[id^=adspot-]')
        .should('have.length', SLIDE_NUM);
      // verify the visibility of the navigation
      cy.get(selector)
        .find('.runa-carousel__navigation-next')
        .should('be.visible');
      cy.get(selector)
        .find('.runa-carousel__navigation-prev')
        .should('be.visible');
      // verify the visibility of the pagination
      cy.get(selector).find('.runa-carousel__pagination').should('be.visible');
      // verify the number of pagination bullets
      cy.get(selector)
        .find('.runa-carousel__pagination')
        .find('.runa-carousel__pagination-bullet')
        .should('have.length', SLIDE_NUM);
      // verify the first slide is visible
      cy.get(selector)
        .find('.runa-carousel')
        .find('[id^=adspot-]')
        .first()
        .should('be.visible');
      // verify the first bullet is active
      cy.get(selector)
        .find('.runa-carousel__pagination')
        .find('.runa-carousel__pagination-bullet')
        .first()
        .should('have.class', 'runa-carousel__pagination-bullet_active');
    });

    it('should move last slide when prev arrow is clicked at first slide', () => {
      const selector = 'div#carousel-loop';
      cy.visit('http://bs-local.com:3111/carousel.html');
      cy.wait(1000);

      // click the prev button
      cy.get(selector).find('.runa-carousel__navigation-prev').click();
      // verify the last slide is visible
      cy.get(selector)
        .find('.runa-carousel')
        .find('[id^=adspot-]')
        .eq(3)
        .should('be.visible');
      // verify the last bullet is active
      cy.get(selector)
        .find('.runa-carousel__pagination')
        .find('.runa-carousel__pagination-bullet')
        .eq(3)
        .should('have.class', 'runa-carousel__pagination-bullet_active');
    });
  });

  context('with including unfilled ads', () => {
    it('should show 4 slides when div tag are 6 but 2 are unfilled', () => {
      const selector = 'div#carousel-unfilled';
      cy.visit('http://bs-local.com:3111/carousel.html');
      cy.wait(1000);

      // verify the visibility of the root element of carousel
      cy.get(selector).find('.runa-carousel').should('be.visible');
      // verify the filled ads are visible
      cy.get(selector)
        .find('.runa-carousel')
        .find('[id^=adspot-filled-]')
        .should('not.have.css', 'display', 'none');
      // verify the unfilled ads are invisible
      cy.get(selector)
        .find('.runa-carousel')
        .find('[id^=adspot-unfilled-]')
        .should('have.css', 'display', 'none');
      // verify the visibility of the navigation
      cy.get(selector)
        .find('.runa-carousel__navigation-next')
        .should('be.visible');
      cy.get(selector)
        .find('.runa-carousel__navigation-prev')
        .should('not.be.visible');
      // verify the visibility of the pagination
      cy.get(selector).find('.runa-carousel__pagination').should('be.visible');
      // verify the number of pagination bullets
      cy.get(selector)
        .find('.runa-carousel__pagination')
        .find('.runa-carousel__pagination-bullet')
        .should('have.length', SLIDE_NUM);
      // verify the first slide is visible
      cy.get(selector)
        .find('.runa-carousel')
        .find('[id^=adspot-]')
        .first()
        .should('be.visible');
      // verify the first bullet is active
      cy.get(selector)
        .find('.runa-carousel__pagination')
        .find('.runa-carousel__pagination-bullet')
        .first()
        .should('have.class', 'runa-carousel__pagination-bullet_active');
    });
  });

  context('with theme = "shadow" in navigation', () => {
    it('should show shadow under arrows of navigation', () => {
      const selector = 'div#carousel-theme-shadow';
      cy.visit('http://bs-local.com:3111/carousel.html');
      cy.wait(1000);

      // verify the visibility of the navigation
      cy.get(selector)
        .find('.runa-carousel__navigation-next')
        .should('be.visible');
      cy.get(selector)
        .find('.runa-carousel__navigation-prev')
        .should('not.be.visible');
      // verify the shadow under the arrows
      cy.get(selector)
        .find('.runa-carousel__navigation-next')
        .should(
          'have.css',
          'filter',
          'drop-shadow(rgba(0, 0, 0, 0.25) 1px 1px 2px)'
        );
    });
  });
  context('with theme = "circle" in navigation', () => {
    it('should show circle around arrows of navigation', () => {
      const selector = 'div#carousel-theme-circle';
      cy.visit('http://bs-local.com:3111/carousel.html');
      cy.wait(1000);

      // verify the visibility of the navigation
      cy.get(selector)
        .find('.runa-carousel__navigation-next')
        .should('be.visible');
      cy.get(selector)
        .find('.runa-carousel__navigation-prev')
        .should('not.be.visible');
      // verify the circle around the arrows
      cy.get(selector)
        .find('.runa-carousel__navigation-next')
        .should('have.css', 'background');
      cy.get(selector)
        .find('.runa-carousel__navigation-next')
        .should('have.css', 'border-radius', '50%');
    });
  });

  context('with free mode', () => {
    it('should show carousel ad with free scroll mode', () => {
      const selector = 'div#carousel-free-mode';
      cy.visit('http://bs-local.com:3111/carousel.html');
      cy.wait(1000);

      // verify the root element does not exist in free mode
      cy.get(selector).find('.runa-carousel').should('not.exist');
      // verify the number of slides
      cy.get(selector).find('[id^=adspot-]').should('have.length', SLIDE_NUM);
      // verify the scroll
      cy.get(selector)
        .scrollIntoView({ offset: { top: 0, left: 100 } })
        .should('be.visible');
    });
  });

  context('with only one renderable ad', () => {
    it('should show ad at center if renderable ad is only one', () => {
      const selector = 'div#carousel-one-ad';
      cy.visit('http://bs-local.com:3111/carousel.html');
      cy.wait(1000);

      // verify the root element does not exist in free mode
      cy.get(selector).find('.runa-carousel').should('not.exist');
      cy.wait(1000);
      // verfy the only one renderable ad is put at center
      cy.get(selector)
        .find('#adspot-one-ad')
        .then(($el) => {
          const marginLeft = parseFloat($el.css('margin-left'));
          const marginRight = parseFloat($el.css('margin-right'));
          const parentWidth = $el.parent().width();
          const elementWidth = $el.width();

          // verify the margin-left and margin-right are same
          expect(marginLeft).to.equal(marginRight);

          // verify the element is put at center
          const expectedMargin = (parentWidth - elementWidth) / 2;
          expect(Math.round(marginLeft)).to.equal(Math.round(expectedMargin));
        });
    });
  });
});
