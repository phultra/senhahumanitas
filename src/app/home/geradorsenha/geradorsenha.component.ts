import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../service/admin/admin.service';
import { DadosSenha } from '../../interface/dadossenha';
import { DadosContador } from '../../interface/dadoscontador';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';


@Component({
  selector: 'app-geradorsenha',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule,NgxSpinnerModule],
  templateUrl: './geradorsenha.component.html',
  styleUrl: './geradorsenha.component.scss'
})
export class GeradorsenhaComponent implements OnInit{
  count: number = 0;
  countNormal: number = 0;
  countPreferencial: number = 0;
  senhaPreferencial: number = 0;
  senhaNormal: number =0;
  senha: DadosSenha [] = [];
  senhaVerificar: DadosSenha[] =[];
  cadastrarSenha: DadosSenha = new DadosSenha;
  contadorSenha: DadosContador[] = [];
  operador: string ='';
  //VARIÁVEL QUE CRIA FORMULARIO
  formulario!: FormGroup;
 //VARIÁVEL DE BUSCA
  formularioBusca!: FormGroup;
  // ACESSAR TELA CONVENCIONAL
  convencional: boolean = false;
  constructor(
  private adminService: AdminService,
  private formBuilder: FormBuilder,
  private spinner: NgxSpinnerService
  ){

  }

  // Método inicial executado ao carregar o componente
 async ngOnInit(){
    this.formbuilder();
    this.formBusca();
    this.convencional =true;
   await this.adminService.getContadorSenhaConvencional().subscribe( d => {
        
      console.log(d);
      console.log(d.length);
      this.senha = d;
      console.log(this.senha);

     
    })

  }

 // Método para inicializar o formulário de cadastro de senhas
  formbuilder(){
      
    this.formulario = this.formBuilder.group({
     
      nome: ['',[Validators.required, Validators.minLength(6)]],
      corretor:['',[Validators.required, Validators.minLength(8)]],
      
    })      
  }

  // Método para inicializar o formulário de busca de senhas
  formBusca() {
    this.formularioBusca = this.formBuilder.group({
      corretor:['',[Validators.required, Validators.minLength(8)]],
    })
  }

  // Gera uma nova senha normal
  async novaSenhaNormal() {
    this.spinner.show();
    this.senhaNormal = 0;
    this.countNormal= 0;
    this.cadastrarSenha.operador = '';
    this.cadastrarSenha.guiche = ''
    this.buscaQuantidadeSenhasGeradasConvencional('AN' , this.cadastrarSenha);


  }


// Gera uma nova senha preferencial  
async  novaSenhaPreferencial() {
  this.spinner.show();
  this.senhaPreferencial = 0;
  this.countPreferencial = 0;
  this.cadastrarSenha.operador = 'PAULO';
  this.cadastrarSenha.guiche = '02';
  this.cadastrarSenha.preferencial =true;
  this.buscaQuantidadeSenhasGeradasConvencional('AP' , this.cadastrarSenha);

  } 


   // Cadastra uma nova senha a partir do formulário
  async cadastrar(){
    this.spinner.show();
    this.count = 0
    console.log(this.formulario.value.corretor);
    this.cadastrarSenha.cliente = this.formulario.value.nome
    this.cadastrarSenha.operador = this.formulario.value.corretor;
    this.cadastrarSenha.guiche = this.formulario.value.corretor.slice(0,2);
    console.log(this.cadastrarSenha.guiche);

     this.buscaQuantidadeSenhasGeradas(this.cadastrarSenha);
     //this.count++;
    
     this.formulario.reset()
  }

  
  // Verifica as senhas cadastradas para o operador informado
  verificar() {
    this.senhaVerificar = [];
    console.log(this.formularioBusca.value);
    this.operador = this.formularioBusca.value.corretor;
    
    
    // Filtra senhas associadas ao operador
    for (let index = 0; index < this.senha.length; index++) {
       
      if (this.senha[index].operador == this.formularioBusca.value.corretor){
         this.senhaVerificar.push(this.senha[index]);
      }
      //console.log(this.senhaNormal);
      //console.log(this.senhaPreferencial);
    }
     
     // Exibe alerta se não houver senhas cadastradas
    if (this.senhaVerificar.length ===0){
      alert('Não exite senha cadastrada para esse corretor');
     }
  }

  
  // Busca a quantidade de senhas geradas no modo convencional
  async buscaQuantidadeSenhasGeradasConvencional(idsenha: string, senha: DadosSenha){
    this.count =0
    this.senhaNormal = 0;
    this.senhaPreferencial = 0;

       // Conta as senhas preferenciais e normais
      for (let index = 0; index < this.senha.length; index++) {
        if(this.senha[index].preferencial === true){
          this.senhaPreferencial = this.senhaPreferencial +1;  
          console.log(this.senhaPreferencial);  
        } else if(this.senha[index].preferencial === false){
          this.senhaNormal=this.senhaNormal +1;
          console.log(this.senhaNormal);
        } 
      }

     
      console.log(this.senhaNormal++);
      console.log(this.senhaPreferencial++);

      
      // Configura e salva a senha dependendo do tipo
      if (idsenha === 'AP'){
            this.cadastrarSenha.senha = (idsenha + this.senhaPreferencial.toString());
            this.cadastrarSenha.setor = 'ATENDIMENTO';
            this.cadastrarSenha.status ='0'
            this.cadastrarSenha.senhaid = Date.now().toString();
            console.log(this.cadastrarSenha.senha);
          await this.adminService.salvaSenhaContadorConvencional(this.cadastrarSenha); 
          
          // Salva a senha no banco de dados e imprime
          await this.adminService.salvaSenhaConvencionalRealime(this.cadastrarSenha).then(async d => {
          
            console.log(d);
           // this.spinner.hide();
           await this.adminService.imprimir(this.cadastrarSenha).subscribe(d =>{
            console.log(d);
            this.spinner.hide();
            })
          }).catch(e => {
            console.log(e);
          });
      } 

      if (idsenha === 'AN') {
            this.cadastrarSenha.senha = (idsenha + this.senhaNormal.toString());
            this.cadastrarSenha.setor = 'ATENDIMENTO';
            this.cadastrarSenha.status ='0'
            this.cadastrarSenha.senhaid = Date.now().toString();
            console.log(this.cadastrarSenha.senha);
          await this.adminService.salvaSenhaContadorConvencional(this.cadastrarSenha); 
          await this.adminService.salvaSenhaConvencionalRealime(this.cadastrarSenha).then(async d => {
          
            console.log(d);
            //this.spinner.hide();
           await this.adminService.imprimir(this.cadastrarSenha).subscribe(d =>{
            console.log(d);
            this.spinner.hide();
            })
          }).catch(e => {
            console.log(e);
          });
      }
  
      this.cadastrarSenha.preferencial =false;
    }

// Busca a quantidade de senhas geradas para um operador específico 
 async buscaQuantidadeSenhasGeradas(senha: DadosSenha){
  this.count = 0

  // Obtém o contador de senhas para o operado 
  await this.adminService.getContadorSenha(senha.operador).then( d => {
      console.log(d.length);
       this.count = d.length +1;
  

    })
    console.log(this.count);
    this.cadastrarSenha.senha = ('TS'+ this.count.toString());
    this.cadastrarSenha.setor = 'ATENDIMENTO';
    this.cadastrarSenha.senhaid = Date.now().toString();
    console.log(this.cadastrarSenha.senha);
    

    // Salva a senha nos serviços correspondentes
     await this.adminService.salvaSenhaRealTime(this.cadastrarSenha) 
     await this.adminService.salvaSenhaEvento(this.cadastrarSenha).then(async d => {
    
     console.log(d);
     await this.adminService.imprimir(this.cadastrarSenha).subscribe(d =>{
      console.log(d);
      this.spinner.hide();
     })
   }).catch(e => {
     console.log(e);
   });

    
  }

}

