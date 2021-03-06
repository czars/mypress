'use strict'

const Language = require('../modules/language')
const Menu = require('../models/menu')
const User = require('../models/user')
const Portfolio = require('../models/portfolio')
const Skill = require('../models/skill')
const Experience = require('../models/experience')

exports.index = function (req, res, next) {
	const websiteName = req.app.get('websiteName')
	const logoString = req.app.get('logoString')
	const logoImage = req.app.get('logoImage')
	const logoLink = req.app.get('logoLink')
	const webTitle = req.app.get('webTitle')
	const webSubtitle = req.app.get('webSubtitle')
	const backgroundImage = req.app.get('backgroundImage')
	const mainButtonString = req.app.get('mainButtonString')
	const mainButtonLink = req.app.get('mainButtonLink')
	const mainButtonTarget = req.app.get('mainButtonTarget')
	const language = req.app.get('language')
	const template = req.app.get('template')
	const templateFile = template + '/index'

	// Get template language data
	const T = Language.getTemplateLanguage(template, language)

	// Define
	const MenuModel = Menu.bindKnex(req.app.get('db').normalDB)
	const UserModel = User.bindKnex(req.app.get('db').normalDB)
	const PortfolioModel = Portfolio.bindKnex(req.app.get('db').normalDB)
	const SkillModel = Skill.bindKnex(req.app.get('db').normalDB)
	const ExperienceModel = Experience.bindKnex(req.app.get('db').normalDB)
	let userList = []
	let menuList = []
	let portfolioList = []
	let skillList = []
	let experienceMap = new Map()

	// Getting menu data
	MenuModel.query().where('language', language).orderBy('order')
	.then(menus => {
		menus.forEach(menu => {
			menuList.push({
				name: menu.name,
				link: menu.link,
				target: menu.target,
			})
		})
		return UserModel.query().innerJoin('user_profiles', 'user_profiles.user_id', 'users.id').where('user_profiles.language', language).orderBy('first_name').orderBy('last_name')
	})
	// Getting user data
	.then(users => {
		users.forEach(user => {
			userList.push({
				username: user.username,
				privilege: user.privilege,
				firstName: user.first_name,
				lastName: user.last_name,
				picture: user.picture,
				email: user.email,
				introduction: user.introduction,
				facebook: user.facebook,
				linkedin: user.linkedin,
				twitter: user.twitter,
				google: user.google,
				flickr: user.flickr
			})
		})
		return PortfolioModel.query().where('language', language).orderBy('name')
	})
	// Getting portfolio data
	.then(portfolios => {
		portfolios.forEach(portfolio => {
			portfolioList.push({
				name: portfolio.name,
				client: portfolio.client,
				role: portfolio.role,
				description: portfolio.description,
				link: portfolio.link,
				target: portfolio.target,
				picture: portfolio.picture,
				pictureAlt: portfolio.picture_alt
			})
		})
		return SkillModel.query().where('language', language).orderBy('order')
	})
	.then(skills => {
		skills.forEach(skill => {
			skillList.push({
				name: skill.name,
				percent: skill.percent,
				color: skill.color,
				animateTime: skill.animate_time
			})
		})
		return ExperienceModel.query().where('language', language).orderBy('start_working_date', 'desc').orderBy('end_working_date', 'desc')
	})
	.then(experiences => {
		experiences.forEach(experience => {
			// Getting the year of experience
			let year = (new Date()).getFullYear()
			if (!experience.still_here) {
				year = experience.end_working_date.getFullYear()
			}
			
			// Getting experiences from the list
			let experienceList = []
			if (experienceMap.has(year)) {
				experienceList = experienceMap.get(year)
			}

			// Adding a new experience
			experienceList.push({
				companyName: experience.company_name,
				companyLogo: experience.company_logo,
				role: experience.role,
				description: experience.description,
				startWorkingDate: experience.start_working_date,
				endWorkingDate: experience.end_working_date,
				stillHere: experience.still_here
			})

			// Writing to the experience map
			experienceMap.set(year, experienceList)
		})
	})
	.catch(err => {
		next(err)
	})
	.finally(() => {
		// Transfer map to the object, because swig dese not support map
		let experiences = {}
		experienceMap.forEach((value, key) => {
			experiences[key] = value
		})

		const resp = {
			T: T,
			language: language,
			websiteName: websiteName,
			logoString: logoString,
			logoImage: logoImage,
			logoLink: logoLink,
			webTitle: webTitle,
			webSubtitle: webSubtitle,
			backgroundImage: backgroundImage,
			mainButtonString: mainButtonString,
			mainButtonLink: mainButtonLink,
			mainButtonTarget: mainButtonTarget,
			template: template,
			menuList: menuList,
			userList: userList,
			portfolioList: portfolioList,
			skillList: skillList,
			experiences: experiences
		}
		res.render(templateFile, resp)
	})
}
